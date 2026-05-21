# Scope Views, Documents, and Notes to Workspaces

## Overview

Currently, **Entities** are scoped to a workspace via a `workspace_id` foreign key on the `entities` table, and `entityGetAll(workspaceId)` filters by it. When the user switches workspace, `WorkspaceService.setActiveWorkspace` reloads entities for that workspace.

However, **Views**, **Documents**, and **Notes** are global - they appear in every workspace regardless. This plan extends the same workspace-scoping pattern to those three resources.

The goal: when the user switches workspace, only the views/documents/notes that belong to that workspace should be visible (and listed in the nav).

## Reference Pattern (Entities)

The entity scoping uses this layered pattern, which we will mirror:

1. **DB schema** (`electron/src/db.ts`): `entities` table has `workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL`. A defensive migration adds the column on existing DBs and backfills to the `'default'` workspace.
2. **Backend service** (`electron/src/service/entity.service.ts`): `getAll(workspaceId?)` filters `WHERE workspace_id = ?`; `createEntity(name, pluralName, workspaceId?)` writes the column.
3. **IPC** (`electron/src/preload.ts` and corresponding `ipcMain` handlers): `entityGetAll(workspaceId)` and `entityCreate(name, pluralName, workspaceId)` pass the id through.
4. **Backend interface** (`webapp/src/app/backend/backend-api.interface.ts` + `electron-backend-api.ts` + `in-memory-backend-api.ts`): typed `workspaceId?` arg on the relevant calls.
5. **Frontend service** (`webapp/src/app/services/entity.service.ts`): `loadAll(workspaceId?)` and `createEntity(..., workspaceId?)` forward.
6. **Workspace switch** (`webapp/src/app/services/workspace.service.ts`): `setActiveWorkspace` calls `entityService.loadAll(id)` to refresh.

We apply the same six-step pattern to views, documents, and notes.

## Changes by File

### 1. `electron/src/db.ts` - DB schema and migrations

Add `workspace_id` columns to three tables, with `ON DELETE SET NULL` (matching `entities`).

**`entity_views`** - update CREATE TABLE:
```sql
workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL
```

**`documents`** - update CREATE TABLE:
```sql
workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL
```

**`notes`** - update CREATE TABLE:
```sql
workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL
```

**Defensive migrations** (matching the existing `entities.workspace_id` migration pattern at lines 234-243). For each of the three tables, after the seed-default-workspace block, add a `PRAGMA table_info(...)` check; if `workspace_id` is missing, `ALTER TABLE ... ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL` and `UPDATE ... SET workspace_id = 'default' WHERE workspace_id IS NULL`.

This ensures existing data (views/documents/notes created before this change) is owned by the default workspace and won't disappear.

### 2. `electron/src/service/view.service.ts`

- `getAll(workspaceId?: string)`: when provided, add `WHERE workspace_id = ?`.
- `create(id, name, entityId, filters, orderBy, workspaceId?)`: insert `workspace_id` column.

Note: the View model currently doesn't carry `workspaceId` because views are scoped through their parent entity. We could rely on the entity's workspace transitively, **but** since the user wants the nav filtered by workspace and views are listed top-level alongside entities, an explicit `workspace_id` on `entity_views` is simpler and matches the pattern. Recommend explicit column.

### 3. `electron/src/service/document.service.ts`

- `getAll(workspaceId?: string)`: filter by `workspace_id`.
- `create(name, description, originalFileName, mimeType, fileBuffer, workspaceId?)`: insert `workspace_id` column.

### 4. `electron/src/service/note.service.ts`

- `getAll(workspaceId?: string)`: filter by `workspace_id`. Preserve `ORDER BY updated_at DESC`.
- `create(name, description, contentJson, contentText, workspaceId?)`: insert `workspace_id` column.

### 5. `electron/src/preload.ts` (and matching ipcMain registrations in main.ts)

Update IPC signatures to pass `workspaceId` through:
- `viewGetAll(workspaceId?: string)`
- `viewCreate(id, name, entityId, filters, orderBy, workspaceId?)`
- `documentGetAll(workspaceId?: string)`
- `documentCreate(..., workspaceId?: string)`
- `noteGetAll(workspaceId?: string)`
- `noteCreate(..., workspaceId?: string)`

Update the corresponding `ipcMain.handle` registrations in `electron/src/main.ts` (or wherever they live) to accept and forward the new arg.

### 6. `webapp/src/app/backend/backend-api.interface.ts`

Add `workspaceId?: string` to the signatures of:
- `viewGetAll`, `viewCreate`
- `documentGetAll`, `documentCreate`
- `noteGetAll`, `noteCreate`

### 7. `webapp/src/app/backend/electron-backend-api.ts` and `in-memory-backend-api.ts`

Update both implementations to match the updated interface. The in-memory one should filter its Map by `workspaceId` when provided, mirroring how it already does for entities.

### 8. Frontend services

**`webapp/src/app/services/view.service.ts`**:
- `loadAll(workspaceId?: string)`: forward to `backend.viewGetAll(workspaceId)`.
- `saveView(entityId, viewName, filters, orderBy, workspaceId?)`: forward to `backend.viewCreate`.

**`webapp/src/app/services/document.service.ts`**:
- `loadAll(workspaceId?: string)`: forward.
- `createDocument(name, description, file, workspaceId?)`: forward.

**`webapp/src/app/services/note.service.ts`**:
- `loadAll(workspaceId?: string)`: forward.
- `createNote(name, description, contentJson, contentText, workspaceId?)`: forward.

### 9. `webapp/src/app/services/workspace.service.ts`

Inject `ViewService`, `DocumentService`, `NoteService` (in addition to the existing `EntityService`, `EntityRecordService`).

Extend `setActiveWorkspace(id)`:
```ts
async setActiveWorkspace(id: string): Promise<void> {
    this.workspaceStore.setActiveId(id);
    await this.entityService.loadAll(id);
    await this.entityRecordService.loadAll();
    await this.viewService.loadAll(id);
    await this.documentService.loadAll(id);
    await this.noteService.loadAll(id);
}
```

### 10. Call sites that create views, documents, notes

Every place that calls `viewService.saveView`, `documentService.createDocument`, or `noteService.createNote` must pass the active workspace id. The cleanest implementation is to **read the active workspace id inside each service** instead of plumbing it through every caller:

Inject `WorkspaceStore` into each of the three frontend services and grab `workspaceStore.getActiveId()` inside `loadAll` / create methods. This mirrors how `EntityService` currently takes a `workspaceId?` param but means call sites don't need to change.

Recommended: services accept an optional `workspaceId` arg AND default to `workspaceStore.getActiveId()` when omitted. This keeps the `EntityService` pattern (explicit arg, called by `WorkspaceService` during workspace switch) but makes create-call-sites simpler.

## Behavioral Notes

- **Existing data**: the migrations backfill `workspace_id = 'default'`, so nothing disappears from existing installs.
- **`ON DELETE SET NULL`**: matches the entity pattern. A view/doc/note whose workspace is deleted becomes "unowned" rather than being deleted. Acceptable for v1.
- **Cross-workspace references**: views reference an `entity_id`; if a view's entity belongs to workspace A but the view is created in workspace B, the view would be in B but reference an entity not visible in B. In practice this won't happen because views are saved from within an entity list page, so the entity (and therefore its workspace) determines the view's workspace. The create flow should default `view.workspaceId` to the active workspace (which equals the entity's workspace).

## Test Plan

- Start with an existing DB and verify defensive migrations add `workspace_id` and backfill to `'default'`.
- Create two workspaces A and B.
- In A, create a view, a document, and a note. Switch to B - they should not appear in the nav.
- In B, create a separate view, document, and note - they should appear only in B.
- Switch back to A - original items reappear; B's items are hidden.
- Delete workspace A - confirm the views/docs/notes are not deleted from the DB (they become unowned with `workspace_id = NULL`).

## Out of Scope

- A UI to "move" a view/document/note from one workspace to another.
- Cleaning up orphaned (`workspace_id = NULL`) rows.
- Cascading delete of views/docs/notes when their workspace is deleted (currently SET NULL, matching entities).
