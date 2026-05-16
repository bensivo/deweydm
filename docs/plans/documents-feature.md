# Documents Feature Plan

## Overview

Add a "Documents" section to the application where users can upload files, view them in a browsable list, and inspect individual documents with their metadata and rendered content. Documents are a first-class entity alongside entity records.

This plan covers **User Journey 2** (Document as raw data): upload a document directly from the Documents page, list it with metadata, link it to entity records, and view it in a detail page.

---

## Data Model

### Document (new model)

```ts
// webapp/src/app/models/document.model.ts
export interface Document {
    id: string;
    name: string;
    description: string;
    originalFileName: string;
    mimeType: string;
    createdAt: string;          // ISO date string
    linkedRecords: DocumentLink[];
}

export interface DocumentLink {
    entityId: string;
    recordId: string;
}
```

The actual file bytes are stored in the app data directory (NOT in SQLite). SQLite stores metadata + the relative file path.

---

## Backend (Electron)

### 1. DB Migration — `electron/src/db.ts`

Add a new `documents` table in `runMigrations`:

```sql
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    original_file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_path TEXT NOT NULL,       -- relative path inside userData/documents/
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_links (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL,
    record_id TEXT NOT NULL
);
```

Also add a helper in `db.ts` (or `main.ts`) that ensures the `documents/` storage directory exists alongside the `db/` directory.

### 2. Document Service — `electron/src/service/document.service.ts`

New service class following the same pattern as `entity-record.service.ts`:

- `getAll(): Promise<Document[]>` — joins `documents` + `document_links`
- `getById(id: string): Promise<Document | undefined>`
- `create(name, description, originalFileName, mimeType, fileBuffer: Buffer): Promise<Document>` — writes the file to `userData/documents/<id>_<originalFileName>`, then inserts a row
- `delete(id: string): Promise<void>` — removes file from disk and DB row (cascade deletes links)
- `addLink(documentId, entityId, recordId): Promise<void>`
- `removeLink(documentId, entityId, recordId): Promise<void>`
- `getFileBuffer(id: string): Promise<Buffer>` — reads the stored file bytes for serving to the renderer

### 3. IPC Handlers — `electron/src/ipc-handlers.ts`

Register a new `DocumentService` instance and add handlers:

| IPC channel | Handler |
|---|---|
| `document:getAll` | `documentService.getAll()` |
| `document:getById` | `documentService.getById(id)` |
| `document:create` | `documentService.create(name, description, originalFileName, mimeType, fileBuffer)` |
| `document:delete` | `documentService.delete(id)` |
| `document:addLink` | `documentService.addLink(documentId, entityId, recordId)` |
| `document:removeLink` | `documentService.removeLink(documentId, entityId, recordId)` |
| `document:getFile` | `documentService.getFileBuffer(id)` — return as `Uint8Array` / base64 string |

### 4. Preload — `electron/src/preload.ts`

Expose all document IPC calls on `window.electronApi`:

```ts
documentGetAll: (): Promise<Document[]> => ipcRenderer.invoke('document:getAll'),
documentGetById: (id: string): Promise<Document> => ipcRenderer.invoke('document:getById', id),
documentCreate: (name: string, description: string, originalFileName: string, mimeType: string, fileBuffer: ArrayBuffer): Promise<Document> =>
    ipcRenderer.invoke('document:create', name, description, originalFileName, mimeType, Buffer.from(fileBuffer)),
documentDelete: (id: string): Promise<void> => ipcRenderer.invoke('document:delete', id),
documentAddLink: (documentId: string, entityId: string, recordId: string): Promise<void> =>
    ipcRenderer.invoke('document:addLink', documentId, entityId, recordId),
documentRemoveLink: (documentId: string, entityId: string, recordId: string): Promise<void> =>
    ipcRenderer.invoke('document:removeLink', documentId, entityId, recordId),
documentGetFile: (id: string): Promise<string> => ipcRenderer.invoke('document:getFile', id),
```

---

## Frontend (Angular)

### 1. Model — `webapp/src/app/models/document.model.ts`

Mirror the backend `Document` and `DocumentLink` interfaces.

### 2. Store — `webapp/src/app/store/document.store.ts`

Signal-based store following the same pattern as `entity-record.store.ts`:

- `private documentsSignal = signal<Document[]>([])`
- `public documents$ = documentsSignal.asReadonly()`
- Methods: `setAll`, `getAll`, `getById`, `add`, `update`, `remove`

### 3. Service — `webapp/src/app/services/document.service.ts`

Business logic service:

- `get documents$()` — proxy to store
- `loadAll(): Promise<void>` — calls `electronApi.documentGetAll()`, sets store
- `createDocument(name, description, file: File): Promise<Document>` — reads `File` as `ArrayBuffer`, calls `electronApi.documentCreate(...)`, adds to store
- `deleteDocument(id: string): Promise<void>`
- `addLink(documentId, entityId, recordId): Promise<void>` — calls IPC, updates store
- `removeLink(documentId, entityId, recordId): Promise<void>`
- `getFileDataUrl(id: string): Promise<string>` — calls `electronApi.documentGetFile(id)`, returns a data URL for rendering

### 4. App Initialization

In `webapp/src/app/app.ts` (or wherever `loadAll()` is called for entities), call `documentService.loadAll()` on startup.

### 5. Routes — `webapp/src/app/app.routes.ts`

Add two new routes:

```ts
{ path: 'documents', component: DocumentsPageComponent },
{ path: 'documents/:id', component: DocumentDetailPageComponent },
```

### 6. Nav — `webapp/src/app/app.html`

Add a "Documents" nav item **above** the entities section in the sidebar:

```html
<li nz-menu-item nzMatchRouter>
    <a routerLink="/documents">Documents</a>
</li>
<li nz-menu-divider class="nav-divider"></li>
<!-- existing entities list -->
```

### 7. Documents List Page — `webapp/src/app/pages/documents/documents.page.ts` (+ `.html`, `.less`)

Features:
- Heading "Documents" with an "+ Upload" button
- `nz-table` with columns: Name, Original File, Description, Linked Records (count), Created At
- Each row is clickable, navigating to `/documents/:id`
- Search input filtering by name
- Upload modal (or inline form) with fields: Name, Description, File picker
  - On submit, calls `documentService.createDocument(...)`

Sub-components in the same folder:
- `document-upload-modal/` — modal with the upload form (name, description, file input). Inputs: `isOpen`. Outputs: `onSubmit(data)`, `onCancel()`.

### 8. Document Detail Page — `webapp/src/app/pages/document-detail/document-detail.page.ts` (+ `.html`, `.less`)

Features:
- Metadata section: Name (editable), Description (editable), Created At, Original File Name
- Linked Records section: list of `entityName / recordDisplayName` pairs with remove button, plus an "Add Link" control (entity selector → record selector)
- Document viewer section:
  - For PDFs: render with `<iframe [src]="dataUrl">` using the data URL
  - For images: render with `<img [src]="dataUrl">`
  - For text/markdown: render inside a `<pre>` block
  - For other types: show a download link (anchor with `href=dataUrl` and `download` attribute)
- Back button navigating to `/documents`

Data loading: on `ngOnInit`, read `:id` from route params, call `documentService.getFileDataUrl(id)` to get the file, and read linked records from the store.

---

## Summary of Files Changed / Created

| File | Action |
|---|---|
| `electron/src/db.ts` | Add `documents` and `document_links` table migrations |
| `electron/src/service/document.service.ts` | New — CRUD + file I/O |
| `electron/src/ipc-handlers.ts` | Register document IPC handlers |
| `electron/src/preload.ts` | Expose document API on `window.electronApi` |
| `webapp/src/app/models/document.model.ts` | New — Document, DocumentLink interfaces |
| `webapp/src/app/store/document.store.ts` | New — signal-based store |
| `webapp/src/app/services/document.service.ts` | New — business logic |
| `webapp/src/app/app.ts` | Call `documentService.loadAll()` on init |
| `webapp/src/app/app.routes.ts` | Add `/documents` and `/documents/:id` routes |
| `webapp/src/app/app.html` | Add Documents nav link above entities |
| `webapp/src/app/pages/documents/documents.page.ts` (+ html, less) | New — list/browse page |
| `webapp/src/app/pages/documents/document-upload-modal/document-upload-modal.component.ts` (+ html, less) | New — upload form modal |
| `webapp/src/app/pages/document-detail/document-detail.page.ts` (+ html, less) | New — detail/viewer page |
