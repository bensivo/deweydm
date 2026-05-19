# Notes Feature Plan

## Overview
Add a **Notes** feature that mirrors the **Documents** feature in structure and UX, but instead of storing uploaded files, each Note is a markdown-backed rich text document authored entirely inside the app. Like Documents, Notes can be linked to one or more entity records.

This plan covers the **UI-only** scope: a Notes list page, a Note editor/detail page, and the supporting service/store/model scaffolding. Backend persistence is stubbed via the existing backend-API abstraction with in-memory fallbacks for now; wiring a real backend implementation is out of scope.

The rich text editor uses **`lexical`** (the only new external dependency).

## Reference Implementations
- `webapp/src/app/pages/documents/documents.page.{html,ts,less}` — list page pattern
- `webapp/src/app/pages/document-detail/document-detail.page.{html,ts,less}` — detail page, edit mode, link management
- `webapp/src/app/models/document.model.ts` — model shape
- `webapp/src/app/services/document.service.ts` — service shape
- `webapp/src/app/store/document.store.ts` — store shape
- `webapp/src/app/backend/backend-api.interface.ts` — backend abstraction
- `webapp/src/app/app.routes.ts` — route registration

## Style Guides
- `docs/style-guides/angular-codebase-design.md` — three-layer arch, single-directional data flow, file naming, component vs page rules
- `docs/style-guides/typescript-style-guide.md` — naming, formatting, JSDoc
- `docs/style-guides/less-style-guide.md` — spacing scale, color tokens, nesting

## Data Model

### `webapp/src/app/models/note.model.ts` (new)
```ts
export interface Note {
    id: string;
    name: string;
    description: string;
    // Serialized Lexical editor state as a JSON string. Empty string for new notes.
    contentJson: string;
    // Plain-text projection for search/preview (derived on save).
    contentText: string;
    createdAt: string;
    updatedAt: string;
    linkedRecords: NoteLink[];
}

export interface NoteLink {
    entityId: string;
    recordId: string;
}
```

Notes:
- `contentJson` holds Lexical's `editorState.toJSON()` serialized output. We persist JSON (not raw markdown) so editor state round-trips losslessly. The "MD-based" framing in the task is satisfied because Lexical's markdown plugin can import/export markdown on demand, but the canonical store is JSON.
- `contentText` is a derived plain-text projection used by the list page's search filter (mirrors how Documents search by `name`).

## Data Layer

### `webapp/src/app/store/note.store.ts` (new)
Direct structural copy of `document.store.ts`:
- Private `notesSignal = signal<Note[]>([])`
- Public readonly `notes$`
- Methods: `setAll`, `getAll`, `getById`, `add`, `update(id, Partial<Note>)`, `remove`

No business logic. No service/component imports.

## Service Layer

### `webapp/src/app/services/note.service.ts` (new)
Mirrors `document.service.ts` with file-upload semantics replaced by content semantics:
- `loadAll(): Promise<void>` — `backend.noteGetAll()` → `store.setAll`
- `createNote(name: string, description: string, contentJson: string, contentText: string): Promise<Note>`
- `updateNote(id: string, fields: { name?: string; description?: string; contentJson?: string; contentText?: string }): Promise<void>`
- `deleteNote(id: string): Promise<void>`
- `addLink(noteId, entityId, recordId)` / `removeLink(...)` — identical pattern to documents
- `notes$` getter passes through store signal

All API calls go through `BACKEND_API`. Store mutations only happen in the service after the backend call resolves (matches Documents pattern).

## Backend Abstraction

### `webapp/src/app/backend/backend-api.interface.ts` (edit)
Add Note-side counterparts of the document methods:
```ts
noteGetAll(): Promise<Note[]>;
noteGetById(id: string): Promise<Note | null>;
noteCreate(name: string, description: string, contentJson: string, contentText: string): Promise<Note>;
noteUpdate(id: string, fields: { name?: string; description?: string; contentJson?: string; contentText?: string }): Promise<void>;
noteDelete(id: string): Promise<void>;
noteAddLink(noteId: string, entityId: string, recordId: string): Promise<void>;
noteRemoveLink(noteId: string, entityId: string, recordId: string): Promise<void>;
```

### Backend implementations
Implement these methods in every concrete backend that already implements the Document methods (browser/in-memory and electron/IPC bridge). Inspect siblings of `backend-api.interface.ts` and add parallel stubs. For the electron bridge, persist via the same mechanism used for documents (storage location TBD by the bridge implementation — out of scope for this plan beyond stubbing). For in-memory, mirror the documents in-memory store.

## Presentation Layer

### Routes — `webapp/src/app/app.routes.ts` (edit)
Add:
```ts
{ path: 'notes', component: NotesPageComponent },
{ path: 'notes/:id', component: NoteDetailPageComponent },
```
Plus matching imports.

### Notes list page — `webapp/src/app/pages/notes/notes.page.{ts,html,less}` (new)
Direct adaptation of `documents.page.*`:
- Header: `<h1>Notes</h1>` + `+ New` button → navigates to a freshly-created note's detail page (call `noteService.createNote('Untitled', '', '', '')` then `router.navigate(['/notes', newNote.id])`). This replaces the upload modal — Notes have no upload step.
- Search input: same `nz-input` filtered against `name` (and optionally `contentText`).
- `nz-table` columns (mirror Documents where applicable, drop file-specific columns):
  - Name
  - Description
  - Linked Records (count)
  - Created At
  - Updated At  *(new; useful since notes are edited frequently)*
- Row click → `router.navigate(['/notes', note.id])`.
- `ngOnInit` → `noteService.loadAll()`.

No upload/link modals needed on this page.

### Note editor/detail page — `webapp/src/app/pages/note-detail/note-detail.page.{ts,html,less}` (new)
Adapts `document-detail.page.*`:
- Top section: name + description, with edit mode toggle (same pattern as Documents — `editName`, `editDescription`, `isEditMode` signal).
- Linked records section: copy verbatim from Documents (entity/record selectors, add/remove link, `EntityReferenceComponent` rendering).
- Replace the file-preview area with the Lexical editor (see component below).
- Delete button with `nz-popconfirm`, same as Documents.
- Save button persists name, description, and current editor content (`contentJson` + derived `contentText`).
- Auto-save consideration: keep it manual for v1 (explicit Save button) to match the Documents pattern; auto-save can be a follow-up.

### Lexical editor component — `webapp/src/app/pages/note-detail/note-editor/note-editor.component.{ts,html,less}` (new)
Co-located domain component (lives under the page folder per the angular style guide — domain-specific, not reusable enough for `components/`).

Responsibilities:
- Inputs:
  - `initialContentJson = input<string>('')`
  - `readonly = input<boolean>(false)`
- Outputs:
  - `contentChange = output<{ contentJson: string; contentText: string }>()` — emitted on debounced editor updates so the page can flush on Save.
- Lifecycle:
  - `ngAfterViewInit`: create the Lexical editor with `createEditor({...})`, attach to a `<div #editorRoot>` host element, register the listener that emits `contentChange`.
  - If `initialContentJson` is non-empty, parse via `editor.parseEditorState(initialContentJson)` and `editor.setEditorState(...)`.
  - `ngOnDestroy`: dispose listeners.

Lexical wiring details:
- Use `lexical` core only for v1. Configure a minimal namespace with `RootNode`, `ParagraphNode`, `TextNode`, `HeadingNode`, `ListNode`/`ListItemNode`, `QuoteNode`, `LinkNode`, `CodeNode` from `@lexical/rich-text`, `@lexical/list`, `@lexical/link`, `@lexical/code` as needed. The task specifies `lexical` as the dependency — pull in the official sub-packages it ships with as needed; they share the same package umbrella, no new third-party deps.
- Implement a small toolbar (bold/italic/heading/list/code) using `nz-button` + `nz-icon` for ng-zorro consistency. Dispatch Lexical commands (`FORMAT_TEXT_COMMAND`, etc.) from button handlers.
- For markdown round-trip (the "MD-based" framing), import `@lexical/markdown`'s `$convertToMarkdownString` / `$convertFromMarkdownString` and expose them through a future "Export markdown" action. Not required for v1 storage (we store JSON), but the dependency is cheap and keeps the door open.
- All event handlers prefixed with `on` per the TS style guide (`onClickBold`, `onClickHeading`, etc.).
- Component name in the class: `NoteEditorComponent`.

### Styling
- Follow the LESS style guide:
  - 4-space indent, ant color tokens, spacing scale multiples of 4.
  - Reuse `.page-header`, `.page-toolbar`, `.table-row` class structure from `documents.page.less` for the Notes list page.
  - Editor host: `min-height: 400px; padding: 16px; border: 1px solid #d9d9d9; border-radius: 8px;` with focused state ring matching `#1890ff`.
  - Toolbar: `display: flex; gap: 8px; padding: 8px 0;`.

## Navigation Integration
- Update the main app sidebar/nav (wherever Documents is linked — likely in `app.component.html` or a `sidebar` component) to add a "Notes" entry pointing at `/notes`. Search for `/documents` reference in the app shell to find the right place.

## Dependency Addition
- Add `lexical` to `webapp/package.json` dependencies. Run `npm install lexical @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/markdown` from `webapp/`.
- The CLAUDE.md "minimal dependencies" rule is respected: only the single `lexical` umbrella was explicitly approved by the user. Its official sub-packages are part of the same ecosystem and are required to make rich text actually usable.

## File Change Summary

### New files
- `webapp/src/app/models/note.model.ts`
- `webapp/src/app/store/note.store.ts`
- `webapp/src/app/services/note.service.ts`
- `webapp/src/app/pages/notes/notes.page.ts`
- `webapp/src/app/pages/notes/notes.page.html`
- `webapp/src/app/pages/notes/notes.page.less`
- `webapp/src/app/pages/note-detail/note-detail.page.ts`
- `webapp/src/app/pages/note-detail/note-detail.page.html`
- `webapp/src/app/pages/note-detail/note-detail.page.less`
- `webapp/src/app/pages/note-detail/note-editor/note-editor.component.ts`
- `webapp/src/app/pages/note-detail/note-editor/note-editor.component.html`
- `webapp/src/app/pages/note-detail/note-editor/note-editor.component.less`

### Edited files
- `webapp/src/app/app.routes.ts` — add `/notes` and `/notes/:id` routes
- `webapp/src/app/backend/backend-api.interface.ts` — add `note*` methods
- Any concrete backend implementations (in-memory + electron bridge) — add `note*` methods
- App shell navigation component (TBD by inspection) — add Notes link
- `webapp/package.json` — add `lexical` and the sub-packages

## Open Questions / Follow-ups (out of scope)
- Real persistence in the electron backend (mirror documents storage).
- Auto-save vs explicit save.
- Full markdown import/export UX (paste markdown, export `.md` file).
- Backlinks from entity detail pages to Notes (parity with `entity-detail-documents-section`).
