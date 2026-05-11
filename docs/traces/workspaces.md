# Workspaces Feature Trace

## Overview

Workspaces are isolated containers for entity schemas and records, allowing users to switch between separate data sets within the same app. Each entity belongs to one workspace, and the active workspace is set at app startup based on whichever workspace has the `isDefault` flag. Users can create, delete, switch between, and set a default workspace from the `/workspaces` page.

## Flow

1. **App startup** - The app bootstraps `WorkspaceService.loadAll()`, which fetches all workspaces from the Electron backend, sets the active workspace to the default one, then triggers entity and record loading scoped to that workspace.
2. **Switching workspaces** - The user navigates to `/workspaces`, selects a workspace, and clicks "Switch". The active workspace ID is updated in the store, and all entities and records are reloaded for the new workspace.
3. **Creating a workspace** - The user clicks "+ New Workspace", enters a name, and confirms. A new workspace row is inserted into SQLite and the new workspace is added to the store.
4. **Setting a default workspace** - The user clicks "Set Default" on any workspace. All `is_default` flags are cleared in SQLite, then the selected workspace's flag is set. The store reflects the change.
5. **Deleting a workspace** - The user clicks "Delete". The row is removed from SQLite and from the store. Entities whose `workspace_id` references the deleted workspace are set to NULL by the DB foreign key constraint.

## Trace

### 1. App startup - load workspaces and seed active workspace

- `webapp/src/app/app.ts` line 57 — `App` constructor calls `workspaceService.loadAll()`
- `webapp/src/app/services/workspace.service.ts` `loadAll()` — calls `electronApi.workspaceGetAll()`, calls `workspaceStore.setAll()`, then calls `setActiveWorkspace(defaultWorkspace.id)`
- `setActiveWorkspace()` — calls `workspaceStore.setActiveId(id)`, then `entityService.loadAll(id)` and `entityRecordService.loadAll()`
- `webapp/src/app/services/entity.service.ts` `loadAll(workspaceId)` — calls `electronApi.entityGetAll(workspaceId)`, updates `EntityStore`

Electron side:
- `electron/src/preload.ts` `workspaceGetAll` / `entityGetAll(workspaceId)` — forwards via `ipcRenderer.invoke`
- `electron/src/ipc-handlers.ts` `workspace:getAll` / `entity:getAll` handlers — delegates to service methods
- `electron/src/service/workspace.service.ts` `getAll()` — `SELECT id, name, is_default, created_at FROM workspaces`
- `electron/src/service/entity.service.ts` `getAll(workspaceId)` — `SELECT ... FROM entities WHERE workspace_id = ?`

### 2. Switching workspaces

- `webapp/src/app/pages/workspaces/workspaces.page.ts` `onClickSwitch(workspace)` — calls `workspaceService.setActiveWorkspace(workspace.id)`, then `router.navigate(['/home'])`
- `webapp/src/app/services/workspace.service.ts` `setActiveWorkspace(id)` — `workspaceStore.setActiveId(id)`, `entityService.loadAll(id)`, `entityRecordService.loadAll()`

### 3. Creating a workspace

- `webapp/src/app/pages/workspaces/workspaces.page.ts` `onConfirmAddWorkspace()` — calls `workspaceService.createWorkspace(name)`
- `webapp/src/app/services/workspace.service.ts` `createWorkspace(name)` — calls `electronApi.workspaceCreate(name)`, then `workspaceStore.add(workspace)`
- `electron/src/ipc-handlers.ts` `workspace:create` handler → `electron/src/service/workspace.service.ts` `create(name)` — `INSERT INTO workspaces (id, name, is_default) VALUES (?, ?, 0)`

### 4. Setting a default workspace

- `webapp/src/app/pages/workspaces/workspaces.page.ts` `onClickSetDefault(workspace)` — calls `workspaceService.setDefaultWorkspace(workspace.id)`
- `webapp/src/app/services/workspace.service.ts` `setDefaultWorkspace(id)` — calls `electronApi.workspaceSetDefault(id)`, then `workspaceStore.setDefault(id)`
- `electron/src/service/workspace.service.ts` `setDefault(id)` — `UPDATE workspaces SET is_default = 0`, then `UPDATE workspaces SET is_default = 1 WHERE id = ?`
- `webapp/src/app/store/workspace.store.ts` `setDefault(id)` — maps all workspaces, sets `isDefault` to `true` only for the matching ID

### 5. Deleting a workspace

- `webapp/src/app/pages/workspaces/workspaces.page.ts` `onClickDelete(workspace)` — calls `workspaceService.deleteWorkspace(workspace.id)`
- `webapp/src/app/services/workspace.service.ts` `deleteWorkspace(id)` — calls `electronApi.workspaceDelete(id)`, then `workspaceStore.remove(id)`
- `electron/src/service/workspace.service.ts` `delete(id)` — `DELETE FROM workspaces WHERE id = ?`; SQLite foreign key `ON DELETE SET NULL` nullifies `entities.workspace_id` for orphaned entities

### Database schema (established in migrations)

- `electron/src/db.ts` `runMigrations()` — creates `workspaces` table; adds `workspace_id` column to `entities`; seeds a `'default'` workspace and backfills existing entities so no data is orphaned on upgrade
