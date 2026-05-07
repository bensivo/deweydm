# Persist Entity Records — Implementation Plan

## Overview
Persist `EntityRecord` instances in the local SQLite database (Electron main process) and wire the Angular webapp's `EntityRecordService` through IPC so records survive app restarts. Mirrors the existing pattern used for entity definitions (entities/fields/options), which are already persisted via `electron/src/service/entity.service.ts` + `ipc-handlers.ts` + `preload.ts` + the webapp's `EntityService.loadAll()` hydration on startup.

## Current State

### Backend (Electron)
- `electron/src/db.ts` — initializes SQLite DB, runs migrations. Currently has tables `entities`, `entity_fields`, `entity_field_options`. **No `entity_records` table.**
- `electron/src/service/entity.service.ts` — CRUD service for entity *definitions*. **No record service yet.**
- `electron/src/ipc-handlers.ts` — registers `entity:*` handlers. **No `entityRecord:*` handlers.**
- `electron/src/preload.ts` — exposes `window.electronApi.entity*` methods. **No record methods.**
- `electron/src/main.ts` — initializes db, registers handlers, creates window. No changes needed unless we wire a record service instance there.

### Webapp
- `webapp/src/app/store/entity-record.store.ts` — signal store, in-memory only.
- `webapp/src/app/services/entity-record.service.ts` — sync CRUD methods (`createRecord`, `updateRecord`, `deleteRecord`). Generates IDs in the renderer. **Does not call any IPC.** Records are lost on reload.
- `webapp/src/app/app.ts` (line 51) — calls `entityService.loadAll()` on startup but **does not load records**.
- Callers of record CRUD (will need to handle async if signatures change):
  - `app.ts:115` — `createRecord` from global create flow
  - `pages/entity-create/entity-create.page.ts:130` — `createRecord`
  - `pages/entity-detail/entity-detail.page.ts:112` — `updateRecord`
  - `pages/entity-detail/entity-detail.page.ts:125` — `deleteRecord`
  - `pages/entity-bulk-create/entity-bulk-create.page.ts:223` — `createRecord` (in a loop)

## Data Model
The renderer model (`webapp/src/app/models/entity-record.model.ts`):
```ts
interface EntityRecord {
    id: string;
    entityId: string;
    data: Record<string, string>; // keyed by EntityField.id
}
```
This shape will be preserved end-to-end. The backend will also expose this same shape (mirrored as a TS interface in the electron service).

## Implementation Plan

### 1. Database migration — `electron/src/db.ts`
Add a fourth `CREATE TABLE IF NOT EXISTS` inside `runMigrations`'s `db.serialize` block:

```sql
CREATE TABLE IF NOT EXISTS entity_records (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL,
    data TEXT NOT NULL,                                -- JSON-encoded Record<string, string>
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);
```

Notes:
- Storing `data` as a JSON string keeps the schema simple and matches the renderer's `Record<string, string>` shape. No need to model fields as columns since field set is dynamic per entity.
- `ON DELETE CASCADE` ensures records vanish when their parent entity is deleted (matches the in-memory expectation).
- Add an index on `entity_id` to keep `getByEntityId` fast:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_entity_records_entity_id ON entity_records(entity_id);
  ```

### 2. Backend service — new file `electron/src/service/entity-record.service.ts`
Mirror the structure of `entity.service.ts`:

```ts
import sqlite3 from 'sqlite3';

export interface EntityRecord {
    id: string;
    entityId: string;
    data: Record<string, string>;
}

export class EntityRecordService {
    constructor(private db: sqlite3.Database) {}

    async getAll(): Promise<EntityRecord[]> { ... }
    async getById(id: string): Promise<EntityRecord | undefined> { ... }
    async getByEntityId(entityId: string): Promise<EntityRecord[]> { ... }
    async createRecord(entityId: string, data: Record<string, string>): Promise<EntityRecord> { ... }
    async updateRecord(id: string, data: Record<string, string>): Promise<void> { ... }
    async deleteRecord(id: string): Promise<void> { ... }

    private generateId(): string { ... }
    private runQuery / allQuery / getQuery (copy from entity.service.ts)
}
```

Implementation details:
- `data` column: `JSON.stringify(data)` on write; `JSON.parse(row.data)` on read.
- `createRecord`: generate id with `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` (matches existing pattern), insert row, return full record.
- `updateRecord`: `UPDATE entity_records SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`.
- `deleteRecord`: `DELETE FROM entity_records WHERE id = ?`.
- `getByEntityId`: `SELECT ... WHERE entity_id = ?`.
- Reuse the same `runQuery`/`allQuery`/`getQuery` helper pattern (consider extracting to a shared util, but for now duplicate to match existing style — note as follow-up).

### 3. IPC handlers — `electron/src/ipc-handlers.ts`
Instantiate the new service alongside `EntityService` and register handlers:

```ts
const entityRecordService = new EntityRecordService(db);

ipcMain.handle('entityRecord:getAll', async () => entityRecordService.getAll());
ipcMain.handle('entityRecord:getById', async (_e, id: string) => entityRecordService.getById(id));
ipcMain.handle('entityRecord:getByEntityId', async (_e, entityId: string) => entityRecordService.getByEntityId(entityId));
ipcMain.handle('entityRecord:create', async (_e, entityId: string, data: Record<string, string>) => entityRecordService.createRecord(entityId, data));
ipcMain.handle('entityRecord:update', async (_e, id: string, data: Record<string, string>) => entityRecordService.updateRecord(id, data));
ipcMain.handle('entityRecord:delete', async (_e, id: string) => entityRecordService.deleteRecord(id));
```

### 4. Preload bridge — `electron/src/preload.ts`
Add to the `electronApi` object:

```ts
entityRecordGetAll: (): Promise<any[]> => ipcRenderer.invoke('entityRecord:getAll'),
entityRecordGetById: (id: string): Promise<any> => ipcRenderer.invoke('entityRecord:getById', id),
entityRecordGetByEntityId: (entityId: string): Promise<any[]> => ipcRenderer.invoke('entityRecord:getByEntityId', entityId),
entityRecordCreate: (entityId: string, data: Record<string, string>): Promise<any> => ipcRenderer.invoke('entityRecord:create', entityId, data),
entityRecordUpdate: (id: string, data: Record<string, string>): Promise<void> => ipcRenderer.invoke('entityRecord:update', id, data),
entityRecordDelete: (id: string): Promise<void> => ipcRenderer.invoke('entityRecord:delete', id),
```

### 5. Webapp — `webapp/src/app/services/entity-record.service.ts`
Convert mutating methods to async, route through `electronApi`, then update the in-memory store on success. Sync read methods that just read from the store stay sync (consistent with how `EntityService.getAll/getById` work today).

```ts
async loadAll(): Promise<void> {
    const records: EntityRecord[] = await (window as any).electronApi.entityRecordGetAll();
    this.entityRecordStore.setAll(records);   // requires new store method (see step 6)
}

async createRecord(entityId: string, data: Record<string, string>): Promise<EntityRecord> {
    const record: EntityRecord = await (window as any).electronApi.entityRecordCreate(entityId, data);
    this.entityRecordStore.add(record);
    return record;
}

async updateRecord(id: string, data: Record<string, string>): Promise<void> {
    await (window as any).electronApi.entityRecordUpdate(id, data);
    this.entityRecordStore.update(id, { data });
}

async deleteRecord(id: string): Promise<void> {
    await (window as any).electronApi.entityRecordDelete(id);
    this.entityRecordStore.remove(id);
}
```

- Drop the local `generateId` — backend now owns ID generation.
- Read methods (`getAll`, `getById`, `getByEntityId`, `getRecordDisplayName`, `getBacklinkedRecords`, `getReferenceOptions`, `getReferenceRouteKey`, `getRefListItems`) stay synchronous against the store.

### 6. Webapp — `webapp/src/app/store/entity-record.store.ts`
Add a `setAll` method to mirror `EntityStore.setAll`:

```ts
setAll(records: EntityRecord[]): void {
    this.recordsSignal.set(records);
}
```

### 7. Webapp — hydrate on startup, `webapp/src/app/app.ts`
In the constructor (line 51), after `this.entityService.loadAll();`, kick off record loading. Records depend on entities being loaded for display-name resolution but the dependency is loose (the store still works either way), so `Promise.all` is fine:

```ts
this.entityService.loadAll();
this.entityRecordService.loadAll();
```

(`EntityRecordService` is already injected into `App`.)

### 8. Update callers to await async record CRUD
The signatures of `createRecord`/`updateRecord`/`deleteRecord` change from sync to `Promise`. Each call site needs to be made async-aware. None of these currently rely on the synchronous return value beyond ignoring it, but `entity-create.page.ts:130` uses the returned record's id for navigation, so it must `await`.

- `webapp/src/app/app.ts:110-117` — `onFormSubmit`: change to `async onFormSubmit`, `await this.entityRecordService.createRecord(...)`.
- `webapp/src/app/pages/entity-create/entity-create.page.ts:130` — already in a method that can be `async`; await the create and use the returned `record.id` for navigation.
- `webapp/src/app/pages/entity-detail/entity-detail.page.ts:112` — `await this.entityRecordService.updateRecord(...)`.
- `webapp/src/app/pages/entity-detail/entity-detail.page.ts:125` — `await this.entityRecordService.deleteRecord(...)`.
- `webapp/src/app/pages/entity-bulk-create/entity-bulk-create.page.ts:223` — currently inside a loop. Two options:
  1. **Sequential** (simpler, safer): convert containing function to async, `await` inside the loop. Slow for large pastes but correct.
  2. **Parallel**: collect promises and `await Promise.all`. Faster but flooded IPC calls. Recommend option 1 for now and revisit if perf complaints emerge.

### 9. Verify entity deletion cascade
`EntityService.deleteEntity` already exists. With the FK + `ON DELETE CASCADE` in step 1, records are auto-deleted when the parent entity is removed. The webapp's in-memory record store does **not** currently prune records on entity delete — confirm whether that's a pre-existing bug or intentional. If we want consistency after entity delete, either:
- Reload records after `deleteEntity` (`await this.entityRecordService.loadAll()`), or
- Filter the record store directly in `EntityService.deleteEntity`.

Recommend option 1 (reload) as the simplest correct fix; flag this as a separate follow-up if not in scope.

## Files Touched

**New:**
- `electron/src/service/entity-record.service.ts`

**Modified:**
- `electron/src/db.ts` — add `entity_records` table + index
- `electron/src/ipc-handlers.ts` — register 6 new handlers, instantiate `EntityRecordService`
- `electron/src/preload.ts` — expose 6 new `entityRecord*` methods
- `webapp/src/app/services/entity-record.service.ts` — async CRUD via IPC, add `loadAll`
- `webapp/src/app/store/entity-record.store.ts` — add `setAll`
- `webapp/src/app/app.ts` — call `entityRecordService.loadAll()` on startup, make `onFormSubmit` async
- `webapp/src/app/pages/entity-create/entity-create.page.ts` — await create
- `webapp/src/app/pages/entity-detail/entity-detail.page.ts` — await update + delete
- `webapp/src/app/pages/entity-bulk-create/entity-bulk-create.page.ts` — await each create in loop

## Testing Plan
1. Fresh DB: launch app, create an entity, add a few records (single + bulk), close app, reopen — records should still be there.
2. Update a record's field value, restart — change should be persisted.
3. Delete a record, restart — record should remain gone.
4. Delete an entity that has records — confirm records are also gone (cascade) and webapp store reflects this after a refresh.
5. Check that reference / backlink / reference-list views still resolve display names after a fresh reload (tests that records hydrate before the user navigates around).

## Out of Scope / Follow-ups
- Optimistic UI: current plan awaits the IPC call before updating the store. If that proves laggy, consider optimistic add + rollback on error.
- Migration of any pre-existing in-memory mock data — the current store starts empty so this isn't an issue today.
- Schema changes when fields are added/removed: data column is JSON, so no migration needed; orphan field IDs in record `data` are tolerated by the renderer.
- Bulk insert performance (`entity-bulk-create.page.ts`) — note for later if users paste hundreds of rows.