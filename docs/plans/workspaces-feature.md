# Workspaces Feature Plan

## Overview

Add a "Workspaces" feature that lets users create multiple isolated workspaces. Each workspace has its own set of entity configs and records. Switching workspaces reloads the entire app state (entities, records) scoped to that workspace.

The **active workspace is managed entirely on the client**. The backend only stores a `is_default` flag to indicate which workspace should be loaded on startup. This allows multiple clients to connect to the same DB and each be in a different active workspace independently.

A new dedicated "Workspaces" page (separate from the existing Workspace Config page) will be the place to create workspaces and switch between them. A nav entry will be added to `app.html`.

---

## Backend (Electron / SQLite)

### 1. `electron/src/db.ts` — Add workspaces table migration

Add a new migration block inside `runMigrations` to create a `workspaces` table:

```sql
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

Also add `workspace_id` column to the `entities` table (nullable, FK to workspaces):

```sql
-- In initial CREATE TABLE for entities, add:
workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL
```

Because `entities` table is created with `CREATE TABLE IF NOT EXISTS`, existing databases will already have the table without the column. Use the same defensive ALTER TABLE pattern already used for `display_order`:

```ts
// Check if workspace_id column exists on entities; add if not
db.all("PRAGMA table_info(entities)", (err, rows) => {
    if (!rows.some(r => r.name === 'workspace_id')) {
        db.run('ALTER TABLE entities ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL', ...);
    }
});
```

Also seed a default workspace if the workspaces table is empty after migration, so existing entity data isn't orphaned:

```sql
INSERT INTO workspaces (id, name, is_default)
SELECT 'default', 'Default', 1
WHERE NOT EXISTS (SELECT 1 FROM workspaces);

UPDATE entities SET workspace_id = 'default' WHERE workspace_id IS NULL;
```

---

### 2. `electron/src/service/workspace.service.ts` — New file

New service class `WorkspaceService` following the same patterns as `EntityService`:

Methods:
- `getAll(): Promise<Workspace[]>` — SELECT all rows from `workspaces`
- `create(name: string): Promise<Workspace>` — INSERT with generated id, `is_default = 0`
- `delete(id: string): Promise<void>` — DELETE by id
- `setDefault(id: string): Promise<void>` — UPDATE all to `is_default = 0`, then SET `is_default = 1` WHERE id

The `is_default` flag only affects which workspace the client loads on startup — it does not filter entity queries.

Model interface (local to service file or exported):
```ts
export interface Workspace {
    id: string;
    name: string;
    isDefault: boolean;
    createdAt: string;
}
```

---

### 3. `electron/src/service/entity.service.ts` — Accept workspaceId parameter

Update `getAll()` to accept a `workspaceId` parameter and filter by it:

```sql
SELECT id, name, plural_name, display_name_field_id
FROM entities
WHERE workspace_id = ?
```

The backend no longer determines which workspace is active — the client passes the workspace id it wants to query.

Update `createEntity(name, pluralName, workspaceId)` to accept and store the workspace id.

---

### 4. `electron/src/ipc-handlers.ts` — Register workspace IPC handlers

Instantiate `WorkspaceService` alongside existing services and register handlers:

- `workspace:getAll` → `workspaceService.getAll()`
- `workspace:create` → `workspaceService.create(name)`
- `workspace:delete` → `workspaceService.delete(id)`
- `workspace:setDefault` → `workspaceService.setDefault(id)`

Update `entity:getAll` handler to accept and forward a `workspaceId` argument to `entityService.getAll(workspaceId)`.

Update `entity:create` handler to accept and forward a `workspaceId` argument to `entityService.createEntity(name, pluralName, workspaceId)`.

---

### 5. `electron/src/preload.ts` — Expose workspace API

Add workspace IPC methods to `electronApi` in the preload script following the existing pattern:

```ts
workspaceGetAll: () => ipcRenderer.invoke('workspace:getAll'),
workspaceCreate: (name: string) => ipcRenderer.invoke('workspace:create', name),
workspaceDelete: (id: string) => ipcRenderer.invoke('workspace:delete', id),
workspaceSetDefault: (id: string) => ipcRenderer.invoke('workspace:setDefault', id),
```

Update the existing `entityGetAll` and `entityCreate` preload wrappers to pass a `workspaceId` argument.

---

## Frontend (Angular Webapp)

### 6. `webapp/src/app/models/workspace.model.ts` — New model file

```ts
export interface Workspace {
    id: string;
    name: string;
    isDefault: boolean;
    createdAt: string;
}
```

---

### 7. `webapp/src/app/store/workspace.store.ts` — New store

Signal-based store following the same pattern as `entity.store.ts`:

```ts
@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
    private workspacesSignal = signal<Workspace[]>([]);
    private activeWorkspaceIdSignal = signal<string | null>(null);

    public workspaces$ = this.workspacesSignal.asReadonly();
    public activeWorkspaceId$ = this.activeWorkspaceIdSignal.asReadonly();

    setAll(workspaces: Workspace[]): void { ... }
    getAll(): Workspace[] { ... }
    getActive(): Workspace | undefined { ... }  // find by activeWorkspaceId
    add(workspace: Workspace): void { ... }
    remove(id: string): void { ... }
    setActiveId(id: string): void { ... }  // update activeWorkspaceIdSignal only
    setDefault(id: string): void { ... }   // update isDefault flags in-memory
}
```

The active workspace id is client-only state — it is never persisted to the backend directly.

---

### 8. `webapp/src/app/services/workspace.service.ts` — New service

Handles all business logic for workspaces. Calls electronApi and updates the store.

Methods:
- `loadAll(): Promise<void>` — fetch all workspaces from backend, call `workspaceStore.setAll()`, then set active to the default workspace id
- `createWorkspace(name: string): Promise<void>` — call backend with the current active workspace id, `workspaceStore.add()`
- `deleteWorkspace(id: string): Promise<void>` — call backend, `workspaceStore.remove()`
- `setActiveWorkspace(id: string): Promise<void>` — call `workspaceStore.setActiveId(id)`, then call `entityService.loadAll(id)` and `entityRecordService.loadAll()` to reload all app state for that workspace
- `setDefaultWorkspace(id: string): Promise<void>` — call `workspace:setDefault` IPC, then `workspaceStore.setDefault(id)`

Property:
- `workspaces$` — proxied from `workspaceStore.workspaces$`
- `activeWorkspace$` — computed from `workspaceStore.getActive()`

---

### 9. `webapp/src/app/services/entity.service.ts` — Pass workspaceId on load

Update `loadAll()` to accept a `workspaceId` and pass it to the `entityGetAll` IPC call. When creating entities, also pass the active workspace id.

---

### 10. `webapp/src/app/app.ts` — Load workspaces on init

In the `App` constructor, call `workspaceService.loadAll()` first. This sets the active workspace from the default flag, then triggers `entityService.loadAll(activeWorkspaceId)` and `entityRecordService.loadAll()` inside `setActiveWorkspace`.

Remove the direct calls to `entityService.loadAll()` and `entityRecordService.loadAll()` from the constructor, since workspace init now drives them.

---

### 11. `webapp/src/app/pages/workspaces/` — New page

New folder `webapp/src/app/pages/workspaces/` with:
- `workspaces.page.ts`
- `workspaces.page.html`
- `workspaces.page.less`

The page displays:
- A list of all workspaces
- An "Active" badge on the currently active workspace (client-side state)
- A "Default" badge on the workspace flagged as default (loaded on startup)
- A "Switch" button on each non-active workspace row that calls `workspaceService.setActiveWorkspace(id)`, then navigates to `/home`
- A "Set Default" button that calls `workspaceService.setDefaultWorkspace(id)`
- An "Add Workspace" button that opens a modal to enter a name and calls `workspaceService.createWorkspace(name)`
- A "Delete" button (disabled for the active workspace) that calls `workspaceService.deleteWorkspace(id)`

Use `nz-list`, `nz-modal`, `nz-button`, `nz-tag` from NG-Zorro.

---

### 12. `webapp/src/app/app.routes.ts` — Register route

Add:
```ts
{ path: 'workspaces', component: WorkspacesPageComponent },
```

---

### 13. `webapp/src/app/app.html` — Add nav link

Add a nav item for the Workspaces page in the sidebar using the same `nz-menu-item` / `routerLink` pattern:

```html
<li nz-menu-item nzMatchRouter>
    <a routerLink="/workspaces">Workspaces</a>
</li>
```

---

## Implementation Order

1. Backend db migration (`db.ts`) — add `workspaces` table + `workspace_id` on entities + seed default
2. Backend workspace service (`workspace.service.ts`)
3. Backend entity service update (accept `workspaceId` param on `getAll` and `createEntity`)
4. IPC handlers (`ipc-handlers.ts`)
5. Preload (`preload.ts`)
6. Frontend model (`workspace.model.ts`)
7. Frontend store (`workspace.store.ts`)
8. Frontend workspace service (`workspace.service.ts`)
9. Frontend entity service update (pass `workspaceId` on load and create)
10. App init (`app.ts`) — drive entity/record loading through workspace init
11. Workspaces page (`.page.ts`, `.page.html`, `.page.less`)
12. Route registration (`app.routes.ts`)
13. Nav link (`app.html`)

---

## Key Design Decisions

- **Active workspace is client-only state**. The backend stores `is_default` only to know which workspace to load on startup. Each connected client independently tracks which workspace it is viewing via `WorkspaceStore.activeWorkspaceIdSignal`.
- **`entity:getAll` is parameterized by workspaceId**. The client tells the backend which workspace to query — the backend never infers it from a server-side active flag. This is what allows multiple clients to query different workspaces simultaneously against the same DB.
- **Entity records are implicitly scoped** through their `entity_id` FK. Since `entity:getAll` filters by the client-supplied workspace id, and `entityRecord:getByEntityId` scopes by entity, records are naturally workspace-scoped without needing a `workspace_id` on the records table.
- **Switching workspaces** updates only the client-side `activeWorkspaceIdSignal`, then re-runs `entityService.loadAll(newWorkspaceId)` and `entityRecordService.loadAll()`, which overwrites the store signals and triggers Angular to re-render all dependent components naturally.
- **Default workspace migration** ensures backward compatibility — existing users get a "Default" workspace and all their entities/records remain accessible.
