# Reorder Entity Fields — Implementation Plan

## Overview
Add up/down arrow buttons next to each row in the Fields table on the entity-config page (`webapp/src/app/pages/entity-config/entity-config.page.ts`) so users can reorder fields. The new order must persist to the entity schema (SQLite via Electron IPC) and be reflected everywhere the entity's fields are iterated — list views, detail views, create forms, bulk-edit, etc.

## Current State

### Backend (Electron)
- `electron/src/db.ts` — `entity_fields` table has columns `id, entity_id, name, type, reference_entity_id, backlink_source_entity_id, backlink_source_field_id, created_at`. **No `display_order` column.** Fields come back in whatever order SQLite chooses (effectively insertion order for now).
- `electron/src/service/entity.service.ts`
  - `getFieldsForEntity(entityId)` runs `SELECT ... FROM entity_fields WHERE entity_id = ?` with no `ORDER BY`.
  - `addField(...)` inserts a new row with no order value.
  - **No reorder method exists.**
- `electron/src/ipc-handlers.ts` — handlers for `entity:addField`, `entity:removeField`, etc. **No reorder handler.**
- `electron/src/preload.ts` — exposes `entityAddField`, `entityRemoveField`, etc. **No reorder method.**

### Webapp
- `webapp/src/app/models/entity.model.ts` — `Entity.fields: EntityField[]`. Order in the array drives all rendering (list columns, detail layout, create-form layout). No explicit `displayOrder` field on `EntityField`; order is purely positional.
- `webapp/src/app/store/entity.store.ts` — `update(id, partial)` accepts a `Partial<Entity>` and merges into the matching entity. Sufficient for replacing the `fields` array.
- `webapp/src/app/services/entity.service.ts` — wraps `electronApi.entity*` calls, mirrors changes into `EntityStore`. **No reorder method.**
- `webapp/src/app/pages/entity-config/entity-config.page.ts` + `.html` — renders the fields table. Each `<tr>` currently has Field Name / Type / Action (Remove) columns. No reorder controls.

### Consumers of field order (verified positional)
All read `entity.fields` in array order — they will pick up the new order automatically once the backend persists it and `EntityService` updates the store.
- Entity list page — column order
- Entity detail page — form-control order
- Entity create page — form-control order
- Bulk edit / bulk create pages — column order
- Reference dropdowns / display name — unaffected (use `displayNameFieldId`, not order)

## Data Model
No changes to the renderer's `EntityField` interface — order remains positional within `Entity.fields[]`. The backend will gain a `display_order INTEGER` column on `entity_fields` purely as a persistence detail; it is *not* surfaced on the renderer model. The service layer sorts by `display_order ASC` when reading and assigns/updates it on insert and reorder.

## Implementation Plan

### 1. Database migration — `electron/src/db.ts`
Inside `runMigrations`, after the existing `CREATE TABLE` statements, add a defensive column-add migration so existing databases upgrade cleanly:

```ts
// Add display_order column if it doesn't already exist
await new Promise<void>((resolve) => {
    db.all("PRAGMA table_info(entity_fields)", (err, rows: any[]) => {
        if (err || !rows) { resolve(); return; }
        const hasDisplayOrder = rows.some(r => r.name === 'display_order');
        if (hasDisplayOrder) { resolve(); return; }
        db.run('ALTER TABLE entity_fields ADD COLUMN display_order INTEGER', () => {
            // Backfill existing rows in insertion (created_at) order, per entity.
            db.run(
                `UPDATE entity_fields SET display_order = (
                    SELECT COUNT(*) FROM entity_fields ef2
                    WHERE ef2.entity_id = entity_fields.entity_id
                      AND ef2.created_at <= entity_fields.created_at
                      AND ef2.id != entity_fields.id
                ) WHERE display_order IS NULL`,
                () => resolve()
            );
        });
    });
});
```

Also update the `CREATE TABLE IF NOT EXISTS entity_fields` statement to include `display_order INTEGER` so fresh installs have it.

### 2. Backend service — `electron/src/service/entity.service.ts`
- Update `getFieldsForEntity` query to include and order by `display_order`:
  ```sql
  SELECT id, name, type, reference_entity_id, backlink_source_entity_id, backlink_source_field_id, display_order
  FROM entity_fields WHERE entity_id = ? ORDER BY display_order ASC, created_at ASC
  ```
- Update `addField` to compute the next `display_order` (max+1 for that entity) and include it in the INSERT.
- Add new method `reorderFields(entityId: string, orderedFieldIds: string[]): Promise<void>`:
  - For each id in `orderedFieldIds`, run `UPDATE entity_fields SET display_order = ? WHERE id = ? AND entity_id = ?` with index `i`.
  - Wrap in a transaction (`BEGIN` / `COMMIT`) using existing `runQuery` helper.
- No changes to the renderer-facing `EntityField` shape; `display_order` is internal.

### 3. IPC handler — `electron/src/ipc-handlers.ts`
Register a new handler:
```ts
ipcMain.handle('entity:reorderFields', async (_e, entityId: string, orderedFieldIds: string[]) => {
    return entityService.reorderFields(entityId, orderedFieldIds);
});
```

### 4. Preload — `electron/src/preload.ts`
Expose:
```ts
entityReorderFields: (entityId: string, orderedFieldIds: string[]): Promise<void> => {
    return ipcRenderer.invoke('entity:reorderFields', entityId, orderedFieldIds);
},
```

### 5. Webapp service — `webapp/src/app/services/entity.service.ts`
Add a method:
```ts
async reorderFields(entityId: string, orderedFieldIds: string[]): Promise<void> {
    await (window as any).electronApi.entityReorderFields(entityId, orderedFieldIds);
    const entity = this.entityStore.getById(entityId);
    if (!entity) return;

    // Re-sort the in-memory fields array to match the new order
    const fieldById = new Map(entity.fields.map(f => [f.id, f]));
    const reordered = orderedFieldIds
        .map(id => fieldById.get(id))
        .filter((f): f is EntityField => !!f);

    this.entityStore.update(entityId, { fields: reordered });
}
```

Provide a convenience helper for the page to call with a single move:
```ts
async moveField(entityId: string, fieldId: string, direction: 'up' | 'down'): Promise<void> {
    const entity = this.entityStore.getById(entityId);
    if (!entity) return;
    const idx = entity.fields.findIndex(f => f.id === fieldId);
    if (idx < 0) return;
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= entity.fields.length) return;

    const newOrder = entity.fields.map(f => f.id);
    [newOrder[idx], newOrder[swapWith]] = [newOrder[swapWith], newOrder[idx]];
    await this.reorderFields(entityId, newOrder);
}
```

### 6. Page component — `webapp/src/app/pages/entity-config/entity-config.page.ts`
Add two event handlers:
```ts
onClickMoveFieldUpButton(fieldId: string): void {
    const entity = this.entity$();
    if (!entity) return;
    this.entityService.moveField(entity.id, fieldId, 'up');
}

onClickMoveFieldDownButton(fieldId: string): void {
    const entity = this.entity$();
    if (!entity) return;
    this.entityService.moveField(entity.id, fieldId, 'down');
}
```

Add a computed helper or use index-based template logic to disable buttons at the ends.

### 7. Page template — `webapp/src/app/pages/entity-config/entity-config.page.html`
- Add an `Order` column header (or merge into the Action column).
- For each field row, use `*ngFor="let field of entity$()!.fields; let i = index; let isFirst = first; let isLast = last"` and add two `nz-button` icon buttons:
  - Up arrow — `nzType="text" nzSize="small"`, `[disabled]="isFirst"`, calls `onClickMoveFieldUpButton(field.id)`
  - Down arrow — same, `[disabled]="isLast"`, calls `onClickMoveFieldDownButton(field.id)`
- Use NG-Zorro icons (`nz-icon` with `nzType="arrow-up"` / `"arrow-down"`) — already available via existing icon imports; if not, add `NzIconModule` to component imports.

### 8. Styles — `webapp/src/app/pages/entity-config/entity-config.page.less`
Minor: a small `.reorder-buttons { display: flex; gap: 4px; }` wrapper class so the two buttons sit cleanly. Follow the spacing scale (4px/8px) from the LESS style guide.

## Files Touched
- `electron/src/db.ts` — migration + table def
- `electron/src/service/entity.service.ts` — read-order, addField order, new `reorderFields`
- `electron/src/ipc-handlers.ts` — new handler
- `electron/src/preload.ts` — new exposed method
- `webapp/src/app/services/entity.service.ts` — `reorderFields` + `moveField`
- `webapp/src/app/pages/entity-config/entity-config.page.ts` — handlers + (maybe) `NzIconModule` import
- `webapp/src/app/pages/entity-config/entity-config.page.html` — up/down buttons in row
- `webapp/src/app/pages/entity-config/entity-config.page.less` — minor button group styles

## Testing / Verification
1. Fresh DB: create an entity, add 3 fields, reorder, reload app — order persists.
2. Existing DB (with no `display_order`): app boots, migration backfills, rendering matches old order.
3. Reordering reflects immediately in:
   - Entity list page columns
   - Entity detail page form
   - Entity create page form
   - Bulk-edit page columns
4. Up button disabled on first row, down button disabled on last row.
5. Removing a field then reordering still works (no stale ids).
