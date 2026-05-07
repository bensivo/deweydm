# Database initializatio and migrations

## Overview
The Electron main process owns a single SQLite3 database file stored in the OS-specific `userData` directory. On every app launch the database file is opened (or created if missing), then a synchronous schema-migration routine runs idempotent `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` statements to ensure the schema is up to date before any IPC handlers are registered or windows are opened. The opened `sqlite3.Database` handle is then injected into the per-domain backend services that perform reads and writes.

## Flow

1. Electron's `app` becomes ready, and the main process kicks off database initialization before it creates any windows or registers IPC handlers.
2. The DB module resolves the database path under Electron's `userData` directory (`<userData>/db/dewey.db`), creates the parent directory on disk if it does not exist, and opens (or creates) the SQLite file.
3. Once the connection is open, the migration routine runs a serialized batch of idempotent DDL statements wrapped in `db.serialize(...)` so they execute in order on a single connection.
4. Migrations create the four core tables (`entities`, `entity_fields`, `entity_field_options`, `entity_records`) with foreign-key constraints, plus a secondary index on `entity_records.entity_id`. Every statement uses `IF NOT EXISTS` so re-running on an existing database is a no-op.
5. The opened `sqlite3.Database` handle is returned to `main.ts`, which passes it into `registerIpcHandlers(...)`, where it is injected into the per-domain services (`EntityService`, `EntityRecordService`) used by every IPC handler.

## Trace

### 1. App startup triggers DB initialization
- `electron/src/main.ts:38` `app.whenReady().then(...)` awaits `initializeDb(app)` before creating any window or registering IPC.
- `electron/src/main.ts:40` passes the resolved `db` handle into `registerIpcHandlers(ipcMain, db)`.

### 2. Resolving the DB file path
- `electron/src/db.ts:7` `getDbPath(app)` joins `app.getPath('userData')` with `db/dewey.db` to produce the per-OS database file path.

### 3. Opening the connection (and creating the directory if needed)
- `electron/src/db.ts:12` `initializeDb(app)` resolves the path, then `fs.existsSync` / `fs.mkdirSync(..., { recursive: true })` ensure `<userData>/db/` exists.
- `electron/src/db.ts:24` `new sqlite3.Database(dbPath, callback)` opens or creates the SQLite file; on success the callback chains into `runMigrations(db)`.

### 4. Running migrations
- `electron/src/db.ts:44` `runMigrations(db)` defines a `run(sql)` Promise wrapper around `db.run(...)`.
- `electron/src/db.ts:55` `db.serialize(...)` serializes the DDL batch on the single connection so statements execute in declared order.
- `electron/src/db.ts:58-115` issues idempotent DDL: `CREATE TABLE IF NOT EXISTS entities`, `entity_fields` (with FK to `entities`, type CHECK constraint, and `UNIQUE(entity_id, id)`), `entity_field_options` (FK to `entity_fields`), `entity_records` (FK to `entities`, JSON `data` TEXT column), plus `CREATE INDEX IF NOT EXISTS idx_entity_records_entity_id`.

### 5. Handing the DB to services via IPC handler registration
- `electron/src/ipc-handlers.ts:9` `registerIpcHandlers(ipcMain, db)` receives the initialized database.
- `electron/src/ipc-handlers.ts:10-11` constructs `new EntityService(db)` and `new EntityRecordService(db)`, injecting the same `sqlite3.Database` handle that every IPC handler will use for reads and writes.

### 6. Service-level usage of the DB handle
- `electron/src/service/entity.service.ts:23-28` `EntityService` stores the injected `db` and uses it via promisified `db.all` / `db.run` helpers for entity schema CRUD.
- `electron/src/service/entity-record.service.ts` `EntityRecordService` uses the same handle to query and mutate the `entity_records` table created in step 4.
