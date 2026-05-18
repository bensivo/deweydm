# Persist Order-By in Views — Feature Plan

## Overview

Extend the existing Order-By feature (see `docs/plans/order-by-feature.md`, commit `0dd12e9`) so order-by configurations are persisted to saved Views, just like Filters are today.

Two behavioral changes:

1. **"Save as View" should be triggered by either filters OR order-by rows.** Currently the button only appears when filters are active. After this change, using order-by alone is enough to enable saving a view.
2. **Order-by rows are saved into the View record** alongside filters, and **restored** when navigating to that view's page.

This affects the model, store, service, backend (frontend interface + electron + in-memory), the DB schema, and both `entity-list` and `view` pages.

---

## Model changes

### `webapp/src/app/models/view.model.ts`

Add `orderBy` to the `View` interface:

```ts
import { Filter } from './filter.model';
import { OrderBy } from './order-by.model';

export interface View {
    id: string;
    name: string;
    entityId: string;
    filters: Filter[];
    orderBy: OrderBy[];
}
```

Treat `orderBy` as required in the type but always tolerate `undefined`/missing on read (older persisted rows may lack the column).

---

## Backend interface changes

### `webapp/src/app/backend/backend-api.interface.ts`

Update `viewCreate` signature to accept order-by rows:

```ts
viewCreate(
    id: string,
    name: string,
    entityId: string,
    filters: Filter[],
    orderBy: OrderBy[],
): Promise<View>;
```

Import `OrderBy` from `../models/order-by.model`.

### `webapp/src/app/backend/in-memory-backend-api.ts`

- Update `viewCreate` to accept and persist `orderBy`. Deep-copy the array (`orderBy.map(o => ({ ...o }))`) just like filters.
- Update `viewGetAll` to ensure returned views have `orderBy: []` if missing.

### `webapp/src/app/backend/electron-backend-api.ts`

- Update `viewCreate` to forward the new `orderBy` argument to `this.api.viewCreate(...)`.

### `electron/src/preload.ts`

- Update `viewCreate(id, name, entityId, filters, orderBy)` signature; pass through to `ipcRenderer.invoke('view:create', id, name, entityId, filters, orderBy)`.

### `electron/src/ipc-handlers.ts`

- Update the `view:create` handler to take the new `orderBy` parameter and pass it to `viewService.create(...)`.

### `electron/src/service/view.service.ts`

- Add a local `OrderBy` interface (mirroring the webapp `OrderBy` model: `{ id, entityId, fieldId, order: 'asc' | 'desc' }`).
- Add `orderBy: OrderBy[]` to the `View` interface.
- Update `create(id, name, entityId, filters, orderBy)`:
  - Serialize `orderBy` as JSON.
  - Insert into the new `order_by` column.
- Update `getAll()` and `getById()`:
  - Select `order_by`.
  - Parse to array; tolerate `NULL` or missing column by defaulting to `[]`.

### `electron/src/db.ts`

Add `order_by` column to the `entity_views` table:

```sql
order_by TEXT NOT NULL DEFAULT '[]'
```

Because there is no migration framework yet, also add an idempotent `ALTER TABLE` after `CREATE TABLE IF NOT EXISTS` for existing DBs:

```sql
ALTER TABLE entity_views ADD COLUMN order_by TEXT NOT NULL DEFAULT '[]'
```

Wrap in try/catch (sqlite errors when column already exists) so re-runs don't fail.

---

## Webapp store changes

### `webapp/src/app/store/view.store.ts`

- Update `createView(id, name, entityId, filters, orderBy)` to accept and store `orderBy`.
- (No other store changes; `setAll` already stores whatever the backend returns.)

---

## Webapp service changes

### `webapp/src/app/services/view.service.ts`

- Import `OrderBy`.
- Update `saveView(entityId, viewName, filters, orderBy)`:
  - Deep-copy `orderBy` (`orderBy.map(o => ({ ...o }))`).
  - Pass to `this.backend.viewCreate(...)`.
  - Pass to `this.viewStore.createView(...)`.

### `webapp/src/app/services/order-by.service.ts`

Add a helper analogous to `FilterService.addFilterWithData`, so saved rows can be restored without re-deriving defaults:

```ts
addOrderByRowWithData(savedRow: OrderBy): void {
    // Push a copy and bump nextOrderByIdSignal past the highest numeric suffix if needed
}
```

The implementation should:
- Append a copy of `savedRow` to `orderByRowsSignal`.
- Update `nextOrderByIdSignal` to remain strictly greater than any existing numeric suffix so newly added rows don't collide.

---

## Page changes

### `webapp/src/app/pages/entity-list/entity-list.page.ts`

In `onConfirmSaveView`:

```ts
const currentFilters = this.filterService.getFilters();
const currentOrderBy = this.orderByService.getOrderByRows();
await this.viewService.saveView(entity.id, viewName, currentFilters, currentOrderBy);
```

### `webapp/src/app/pages/entity-list/entity-list.page.html`

Update the visibility predicate on the "Save as View" button so order-by rows also enable it:

```html
*ngIf="getFiltersSignal()().length > 0 || getOrderByRowsSignal()().length > 0"
```

### `webapp/src/app/pages/view/view.page.ts`

Two updates in `ngOnInit` (the block where filters are restored from the saved view):

1. After clearing existing order-by rows for this entity, restore order-by rows from the view:

```ts
this.orderByService.setCurrentEntity(view.entityId);
const existingOrderByRows = this.orderByService.getOrderByRows();
existingOrderByRows.forEach(row => this.orderByService.removeOrderByRow(row.id));

(view.orderBy ?? []).forEach(row => {
    this.orderByService.addOrderByRowWithData(row);
});
```

2. Update `onConfirmSaveView` to pass current order-by rows (same as entity-list):

```ts
const currentFilters = this.filterService.getFilters();
const currentOrderBy = this.orderByService.getOrderByRows();
await this.viewService.saveView(entity.id, viewName, currentFilters, currentOrderBy);
```

### `webapp/src/app/pages/view/view.page.html`

Update the "Save as View" button predicate the same way as `entity-list.page.html` (so a view page can be re-saved when only order-by changed — though current UX creates a brand new view from this button).

---

## Files Summary

| Action | File |
|--------|------|
| Edit   | `webapp/src/app/models/view.model.ts` |
| Edit   | `webapp/src/app/backend/backend-api.interface.ts` |
| Edit   | `webapp/src/app/backend/in-memory-backend-api.ts` |
| Edit   | `webapp/src/app/backend/electron-backend-api.ts` |
| Edit   | `webapp/src/app/store/view.store.ts` |
| Edit   | `webapp/src/app/services/view.service.ts` |
| Edit   | `webapp/src/app/services/order-by.service.ts` (add `addOrderByRowWithData`) |
| Edit   | `webapp/src/app/pages/entity-list/entity-list.page.ts` |
| Edit   | `webapp/src/app/pages/entity-list/entity-list.page.html` |
| Edit   | `webapp/src/app/pages/view/view.page.ts` |
| Edit   | `webapp/src/app/pages/view/view.page.html` |
| Edit   | `electron/src/preload.ts` |
| Edit   | `electron/src/ipc-handlers.ts` |
| Edit   | `electron/src/service/view.service.ts` |
| Edit   | `electron/src/db.ts` |

No new files. No new stores.

---

## Implementation Notes

- Always treat `view.orderBy` as possibly `undefined` when reading (older persisted rows or in-memory views created before this change). Coalesce to `[]` everywhere.
- Deep-copy order-by rows on save and on restore so saved view objects can't be mutated by later UI interactions (mirrors how filters are handled).
- The SQLite schema change uses an additive column with a default of `'[]'`; combined with an idempotent `ALTER TABLE` it keeps existing DBs working without a migration framework.
- Field-type restrictions for the order-by dropdown remain unchanged (set by `OrderByService.isSortableFieldType`).
- No UI for editing existing views is being added — creation-time persistence + load-time restore is sufficient for this feature.
