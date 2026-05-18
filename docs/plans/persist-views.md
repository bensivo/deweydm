# Persist Views — Implementation Plan

## Overview

Views (saved filter configurations on entity-list pages) currently live only in
the in-memory `ViewStore` and disappear on app restart. This plan persists views
to SQLite via the Electron IPC layer, mirroring the pattern used by entities
and column-visibility.

A View is owned by an entity and consists of:
- `id`, `name`, `entityId`
- A list of `Filter` objects (`{ id, fieldId, operator, value }`)

`filters` will be stored as a JSON-encoded blob — same approach as
`entity_records.data` and `column_visibility.field_ids`. Filters are tightly
coupled to a view and never queried individually in SQL, so a JSON column is
sufficient and keeps the schema simple.

## Storage Format

New SQLite table `entity_views` (named with the `entity_` prefix so it isn't
confused with SQL views; the service/code layer still calls them "views"):

| column     | type     | notes                                                          |
|------------|----------|----------------------------------------------------------------|
| id         | TEXT PK  | view id                                                        |
| name       | TEXT     | display name                                                   |
| entity_id  | TEXT     | FK to `entities(id)` ON DELETE CASCADE                         |
| filters    | TEXT     | JSON-encoded `Filter[]`                                        |
| created_at | DATETIME | default `CURRENT_TIMESTAMP`                                    |

Index on `entity_id` for lookup by entity.

## Implementation

### 1. DB migration — `electron/src/db.ts`

Inside `runMigrations`, add:

```sql
CREATE TABLE IF NOT EXISTS entity_views (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    filters TEXT NOT NULL DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_entity_views_entity_id ON entity_views(entity_id);
```

### 2. Electron service — `electron/src/service/view.service.ts` (NEW)

Mirror the shape of `entity.service.ts`. Methods:

- `getAll(): Promise<View[]>` — `SELECT * FROM entity_views`, JSON-parse `filters`.
- `getById(id: string): Promise<View | undefined>`
- `create(id: string, name: string, entityId: string, filters: Filter[]): Promise<View>` —
  INSERT, JSON-stringify filters. Accept the id from the caller so the frontend
  keeps the generator it already uses (consistent with `EntityRecordService`
  pattern, or alternatively generate server-side — pick one; current frontend
  generates the id, so accept it).
- `delete(id: string): Promise<void>`

Local types: define `Filter` and `View` interfaces in this file (matching the
frontend models in `webapp/src/app/models/`).

### 3. IPC handlers — `electron/src/ipc-handlers.ts`

```
view:getAll                   → View[]
view:create  (id, name, entityId, filters) → View
view:delete  (id)             → void
```

Instantiate `ViewService` alongside the others at the top of `register(...)`.

### 4. Preload — `electron/src/preload.ts`

Expose:
```
viewGetAll(): Promise<View[]>
viewCreate(id, name, entityId, filters): Promise<View>
viewDelete(id): Promise<void>
```

### 5. Backend API interface — `webapp/src/app/backend/`

- `backend-api.interface.ts`: add the three methods to the `Backend` interface.
- `electron-backend-api.ts`: forward to `window.electronAPI.view*`.
- `in-memory-backend-api.ts`: implement an in-memory equivalent (array-backed),
  matching how entities/records are mocked there today.

### 6. Frontend service — `webapp/src/app/services/view.service.ts`

Update to use the backend, following the `EntityService` pattern:

- Inject `BACKEND_API` token.
- Add `async loadAll(): Promise<void>` that calls `backend.viewGetAll()` and
  hydrates `ViewStore` via a new `setAll(views)` method.
- Change `saveView(...)` to `async saveView(...)`: call `backend.viewCreate(...)`
  first, then update the store with the returned view.
- Add `async deleteView(viewId)`: call backend then store.
- Keep `generateViewId()` for the id passed to the backend (consistent with
  how the frontend names views).

### 7. Store — `webapp/src/app/store/view.store.ts`

Add `setAll(views: View[]): void` that replaces `viewsSignal`. Keep existing
methods unchanged; `createView` / `deleteView` continue to be the pure-state
mutations.

### 8. App init — `webapp/src/app/app.ts`

In the constructor (alongside `workspaceService.loadAll()` and
`documentService.loadAll()`), add `this.viewService.loadAll();`.

### 9. Callers of `saveView`

`saveView` becomes async. Update the two callers:

- `webapp/src/app/pages/entity-list/entity-list.page.ts` — `onConfirmSaveView`
- `webapp/src/app/pages/view/view.page.ts` — `onConfirmSaveView`

Make them `async` and `await viewService.saveView(...)`. The modal-close calls
that follow can stay; they don't depend on the result.

## Out of Scope

- Editing a view (rename / update filters): not currently supported in the UI;
  leave for later. The `ViewStore.updateView` method already exists in memory
  but is unused.
- Per-workspace view scoping: views are tied to an entity, and entities are
  already workspace-scoped, so views inherit that filter transitively through
  the entity list shown in the sidebar. No extra workspace_id column needed.

## Files Touched

**New:**
- `electron/src/service/view.service.ts`
- `docs/plans/persist-views.md` (this file)

**Modified:**
- `electron/src/db.ts` — migration
- `electron/src/ipc-handlers.ts` — register handlers
- `electron/src/preload.ts` — expose API
- `webapp/src/app/backend/backend-api.interface.ts`
- `webapp/src/app/backend/electron-backend-api.ts`
- `webapp/src/app/backend/in-memory-backend-api.ts`
- `webapp/src/app/services/view.service.ts`
- `webapp/src/app/store/view.store.ts`
- `webapp/src/app/app.ts` — call `viewService.loadAll()` on init
- `webapp/src/app/pages/entity-list/entity-list.page.ts` — await saveView
- `webapp/src/app/pages/view/view.page.ts` — await saveView
