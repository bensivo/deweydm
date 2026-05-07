# Entity Record Persistence

## Overview
Entity records (instances of user-configured entities) are persisted in a SQLite database that lives in the Electron main process. The Angular renderer interacts with the database through a `contextBridge`-exposed `electronApi` which forwards calls over `ipcRenderer.invoke` to IPC handlers in the main process. On app start the renderer hydrates its in-memory signal store from the database, and every subsequent create/update/delete writes through to SQLite before updating the store.

## Flow

1. On Electron app startup, the main process opens (or creates) a SQLite database file in `userData/db/dewey.db` and runs migrations to ensure the `entity_records` table exists.
2. The main process registers IPC handlers for entity-record CRUD operations. Each handler delegates to a backend `EntityRecordService` that wraps SQLite queries.
3. The preload script exposes a typed `electronApi` object on `window` in the renderer; each method wraps an `ipcRenderer.invoke(...)` call.
4. When the Angular `App` component boots, it calls `EntityRecordService.loadAll()`, which invokes `entityRecord:getAll` over IPC, parses the JSON-encoded `data` column for each row, and replaces the signal store contents with the result.
5. UI pages (e.g. `EntityCreatePage`, `EntityDetailPage`, the global create modal) call the Angular `EntityRecordService` for create/update/delete. Each method first awaits the IPC call, then mirrors the change into the `EntityRecordStore` signal so the UI re-renders.
6. The backend `EntityRecordService` serializes `data: Record<string, string>` to JSON on writes, generates IDs as `<timestamp>-<random>`, and parses the JSON back to an object on reads.

## Trace

### 1. DB initialization & migrations
- `electron/src/main.ts:38` `app.whenReady()` calls `initializeDb(app)` then `registerIpcHandlers(ipcMain, db)`.
- `electron/src/db.ts:12` `initializeDb()` opens `userData/db/dewey.db` and calls `runMigrations()`.
- `electron/src/db.ts:102` `runMigrations()` creates the `entity_records` table (`id`, `entity_id`, `data` TEXT JSON, timestamps) and an index on `entity_id`.

### 2. IPC handler registration
- `electron/src/ipc-handlers.ts:11` instantiates `new EntityRecordService(db)`.
- `electron/src/ipc-handlers.ts:54-76` registers `entityRecord:getAll`, `getById`, `getByEntityId`, `create`, `update`, `delete` handlers, each delegating to the service.

### 3. Renderer-side bridge
- `electron/src/preload.ts:54-71` exposes `entityRecordGetAll`, `entityRecordGetById`, `entityRecordGetByEntityId`, `entityRecordCreate`, `entityRecordUpdate`, `entityRecordDelete` on `window.electronApi`, each wrapping `ipcRenderer.invoke('entityRecord:...')`.

### 4. Hydrating store on app start
- `webapp/src/app/app.ts:52` `App` constructor calls `entityRecordService.loadAll()`.
- `webapp/src/app/services/entity-record.service.ts:36` `loadAll()` calls `electronApi.entityRecordGetAll()` and passes the result into `entityRecordStore.setAll(records)`.
- `webapp/src/app/store/entity-record.store.ts:16` `setAll()` writes to the `recordsSignal`, triggering re-render of any subscribed UI.

### 5. Backend read path (`getAll`)
- `electron/src/ipc-handlers.ts:54` handler invokes `entityRecordService.getAll()`.
- `electron/src/service/entity-record.service.ts:29` `getAll()` runs `SELECT id, entity_id, data FROM entity_records` and maps each row through `rowToRecord()`.
- `electron/src/service/entity-record.service.ts:102` `rowToRecord()` `JSON.parse`s the `data` column into `Record<string, string>`.

### 6. Create flow (UI -> store -> SQLite)
- `webapp/src/app/pages/entity-create/entity-create.page.ts:125` `onClickSubmit()` calls `entityRecordService.createRecord(entity.id, formData)`.
- `webapp/src/app/services/entity-record.service.ts:49` `createRecord()` awaits `electronApi.entityRecordCreate(entityId, data)` then calls `entityRecordStore.add(record)`.
- `electron/src/ipc-handlers.ts:66` handler delegates to `entityRecordService.createRecord(entityId, data)`.
- `electron/src/service/entity-record.service.ts:68` `createRecord()` generates an id, runs `INSERT INTO entity_records (id, entity_id, data) VALUES (?, ?, ?)` with `JSON.stringify(data)`, returns the new `EntityRecord`.

### 7. Update flow
- `webapp/src/app/pages/entity-detail/entity-detail.page.ts` (save handler) calls `entityRecordService.updateRecord(id, data)`.
- `webapp/src/app/services/entity-record.service.ts:61` `updateRecord()` awaits `electronApi.entityRecordUpdate(id, data)` then calls `entityRecordStore.update(id, { data })`.
- `electron/src/service/entity-record.service.ts:87` `updateRecord()` runs `UPDATE entity_records SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`.

### 8. Delete flow
- `webapp/src/app/services/entity-record.service.ts:71` `deleteRecord()` awaits `electronApi.entityRecordDelete(id)` then calls `entityRecordStore.remove(id)`.
- `electron/src/service/entity-record.service.ts:98` `deleteRecord()` runs `DELETE FROM entity_records WHERE id = ?`.
