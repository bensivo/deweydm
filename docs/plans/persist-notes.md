# Persist Notes in SQLite

## Overview
The Notes feature is already fully implemented on the webapp side (model, store, service, pages, backend abstraction, Electron IPC bindings), but the Electron main process keeps notes in an **in-memory `Map<string, NoteStub>`** inside `electron/src/ipc-handlers.ts`. As a result, all notes vanish when the app restarts.

This plan moves notes onto SQLite, mirroring the existing **Document** persistence pattern (schema in `electron/src/db.ts`, service class in `electron/src/service/document.service.ts`, wired in `electron/src/ipc-handlers.ts`).

No webapp changes are required — the existing `Note` model, `NoteService`, `noteStore`, `Backend.note*` methods, and `electron-backend-api.ts` already match the contract the new service will expose.

## Reference Files
- `electron/src/db.ts` — schema/migrations, `documents` and `document_links` tables (lines 156–175)
- `electron/src/service/document.service.ts` — service class shape: CRUD, link add/remove, sqlite helper wrappers
- `electron/src/ipc-handlers.ts` lines 174–264 — existing in-memory note handlers to be replaced
- `electron/src/ipc-handlers.ts` lines 18, 145–172 — DocumentService instantiation + IPC handler shape to mirror
- `webapp/src/app/models/note.model.ts` — `Note` / `NoteLink` shape the service must return
- `webapp/src/app/backend/backend-api.interface.ts` lines 71–86 — backend contract notes must satisfy

## Style Guides
- `docs/typescript-style-guide.md` — 4-space indent, single quotes, JSDoc on public methods
- `docs/angular-codebase-design.md` — service layer responsibility (only relevant for context, no webapp changes)

## Data Model

Two new SQLite tables, both modeled directly after `documents` / `document_links`.

```sql
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    content_json TEXT NOT NULL DEFAULT '',
    content_text TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS note_links (
    id TEXT PRIMARY KEY,
    note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL,
    record_id TEXT NOT NULL
);
```

Unlike `documents`, notes have no filesystem component — content lives entirely in the `content_json` / `content_text` columns.

## Implementation Steps

### 1. Add schema to `electron/src/db.ts`
Inside the `runMigrations` `db.serialize` block (after the `document_links` table creation, before `entity_views`), add the two `CREATE TABLE IF NOT EXISTS` statements above. No defensive `PRAGMA table_info` migration needed since these are brand-new tables.

### 2. Create `electron/src/service/note.service.ts` (new)
Mirror the structure of `document.service.ts`. Class `NoteService` with a `sqlite3.Database` constructor parameter (no documents-dir analog needed).

Public interface:
```ts
export interface Note {
    id: string;
    name: string;
    description: string;
    contentJson: string;
    contentText: string;
    createdAt: string;
    updatedAt: string;
    linkedRecords: NoteLink[];
}
export interface NoteLink {
    entityId: string;
    recordId: string;
}

class NoteService {
    constructor(db: sqlite3.Database)
    getAll(): Promise<Note[]>                          // ORDER BY updated_at DESC
    getById(id: string): Promise<Note | undefined>
    create(name, description, contentJson, contentText): Promise<Note>
    update(id, fields: { name?, description?, contentJson?, contentText? }): Promise<void>
        // Also updates updated_at = CURRENT_TIMESTAMP on any update
    delete(id: string): Promise<void>
    addLink(noteId, entityId, recordId): Promise<void>
        // Should de-dupe: skip insert if (noteId, entityId, recordId) already exists,
        // matching the existing in-memory stub semantics.
    removeLink(noteId, entityId, recordId): Promise<void>
}
```

Private helpers — reuse the exact `runQuery` / `allQuery` / `getQuery` / `generateId` patterns from `DocumentService`. Use a private `getLinks(noteId)` and `rowToNote(row, links)` for hydration, also mirroring `DocumentService`.

For `update`, prefer building a single dynamic `UPDATE notes SET ... WHERE id = ?` statement that always also sets `updated_at = CURRENT_TIMESTAMP`, rather than the if/else chain DocumentService uses — this avoids combinatorial explosion with 4 mutable fields. Skip the call entirely if no fields are provided.

### 3. Wire `NoteService` into `electron/src/ipc-handlers.ts`
- Add import: `import { NoteService } from './service/note.service';`
- After `const viewService = new ViewService(db);`, add `const noteService = new NoteService(db);`
- **Delete** lines 174–264 (the `NoteStub` interface, the `notes` Map, and every `ipcMain.handle('note:*', ...)` block).
- Re-register the seven note IPC handlers, each delegating to `noteService` — same pattern as the document handlers (lines 145–172):
  - `note:getAll` → `noteService.getAll()`
  - `note:getById` → `noteService.getById(id)` (returning `null` instead of `undefined` to match the `Backend.noteGetById` contract; wrap with `?? null`)
  - `note:create` → `noteService.create(name, description, contentJson, contentText)`
  - `note:update` → `noteService.update(id, fields)`
  - `note:delete` → `noteService.delete(id)`
  - `note:addLink` → `noteService.addLink(noteId, entityId, recordId)`
  - `note:removeLink` → `noteService.removeLink(noteId, entityId, recordId)`

### 4. No changes needed in:
- `electron/src/preload.ts` — channel names unchanged
- `electron/src/main.ts` — `registerIpcHandlers` signature unchanged (NoteService is constructed internally from the existing `db` arg)
- Anything under `webapp/` — backend abstraction already targets these channels

## Verification
1. Start app fresh, create a note with content + links, fully quit, relaunch — note should be present with content and links intact.
2. Edit a note's name/description/content; confirm `updated_at` advances (notes list ordered by `updated_at DESC` should reflect this).
3. Delete a note — `note_links` rows for that note should be removed (verified by `ON DELETE CASCADE`).
4. Add then remove a link; re-add the same link twice — only one row should exist (dedup behavior).
5. Existing user DBs missing the `notes` / `note_links` tables get them created on next launch via `CREATE TABLE IF NOT EXISTS`.

## Out of Scope
- Any webapp-side changes
- Full-text search index on `content_text` (table is shaped to allow adding later)
- Backfill/migration of in-memory stub data (the stub never persisted, so there is nothing to migrate)
