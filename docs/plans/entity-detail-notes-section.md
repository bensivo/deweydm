# Entity Detail - Notes Section

## Summary

Add a "Notes" card to the entity detail page (`EntityDetailPageComponent`), mirroring the existing "Documents" card. Users will be able to:

- See a list of notes linked to the current entity record (clickable links to note detail).
- Create a new note inline and automatically link it to the current record.
- Link an existing note to the current record.
- Unlink a note from the current record.

This reuses the established patterns from the Documents section on the entity-detail page, and the linking model already implemented in `NoteService` / `NoteStore`.

## Context / Reference Files

- Documents section pattern on entity detail:
  - `webapp/src/app/pages/entity-detail/entity-detail.page.html` (lines 119-141 - Documents card)
  - `webapp/src/app/pages/entity-detail/entity-detail.page.ts` (`linkedDocuments$`, `onClickUploadDocument`, `onClickLinkExisting`, `onLinkDocumentSelect`, `onClickUnlinkDocument`)
- Note linking model already in place:
  - `webapp/src/app/services/note.service.ts` (`createNote`, `addLink`, `removeLink`, `loadAll`)
  - `webapp/src/app/store/note.store.ts`
  - `webapp/src/app/models/note.model.ts` (`Note`, `NoteLink`)
- Existing modals to reference as patterns:
  - `webapp/src/app/pages/documents/document-link-modal/` - existing-doc picker
  - `webapp/src/app/pages/notes/note-create-modal/` - inline note creation (reuse as-is if its API is compatible; otherwise base the new modal on it)
- Note detail (link target): `/notes/:id` route, see `webapp/src/app/pages/note-detail/note-detail.page.html`.

## Files to Create

### 1. `webapp/src/app/pages/entity-detail/note-link-modal/note-link-modal.component.{ts,html,less}`

A new modal for selecting an existing note to link to the record. Modeled on `document-link-modal.component.ts`.

- Inputs:
  - `isOpen: boolean`
  - `notes: Note[]`
- Outputs:
  - `onSelect: EventEmitter<Note>`
  - `onCancel: EventEmitter<void>`
- UI: nz-modal containing a searchable list of notes (filter by name). Clicking a row emits `onSelect`.

## Files to Modify

### 2. `webapp/src/app/pages/entity-detail/entity-detail.page.ts`

Add note-related state and handlers, mirroring documents.

- Imports:
  - `NoteService` from `../../services/note.service`
  - `Note` from `../../models/note.model`
  - `NoteLinkModalComponent` (new, above)
  - Reuse existing `NoteCreateModalComponent` from `../notes/note-create-modal/...` for inline create. Verify its `@Input`/`@Output` API; if it does not support being externally controlled by `isOpen`, refactor it (or add a thin wrapper) so it can be opened from this page.
- Constructor: inject `noteService: NoteService`.
- New computed signals:
  - `allNotes$ = computed(() => this.noteService.notes$())`
  - `linkedNotes$ = computed(() => { ... filter notes whose linkedRecords match current entity.id + record.id })`
- New signals:
  - `isNoteCreateModalOpen = signal(false)`
  - `isNoteLinkModalOpen = signal(false)`
- New handlers:
  - `onClickCreateNote()` -> open create modal
  - `onCreateNoteSubmit(data)` -> `noteService.createNote(...)` then `noteService.addLink(noteId, entity.id, record.id)`; success/error message; close modal
  - `onCreateNoteCancel()`
  - `onClickLinkExistingNote()` -> open link modal
  - `onLinkNoteSelect(note: Note)` -> `noteService.addLink(...)`; close modal
  - `onLinkNoteCancel()`
  - `onClickUnlinkNote(noteId: string)` -> `noteService.removeLink(...)`
- `ngOnInit`: also call `this.noteService.loadAll()`.

### 3. `webapp/src/app/pages/entity-detail/entity-detail.page.html`

Add a "Notes" card directly below the existing "Documents" card. Structure mirrors the Documents card.

```html
<nz-card class="notes-card" [nzTitle]="notesCardTitle">
  <ng-template #notesCardTitle>
    <div class="notes-card-header">
      <span>Notes</span>
      <div class="notes-card-btn-container">
        <button nz-button nzType="default" nzSize="small" (click)="onClickCreateNote()">+ New</button>
        <button nz-button nzType="default" nzSize="small" (click)="onClickLinkExistingNote()">+ Link Existing</button>
      </div>
    </div>
  </ng-template>

  <div *ngIf="linkedNotes$().length === 0" class="no-notes">No notes</div>

  <div *ngFor="let note of linkedNotes$()" class="note-row">
    <a [routerLink]="['/notes', note.id]" class="note-name">{{ note.name }}</a>
    <button nz-button nzType="text" nzDanger nzSize="small"
            nz-tooltip nzTooltipTitle="Unlink note"
            (click)="onClickUnlinkNote(note.id)">
      <span nz-icon nzType="disconnect"></span>
    </button>
  </div>
</nz-card>
```

Also add the two modals near the existing document modals:

```html
<app-note-create-modal
  [isOpen]="isNoteCreateModalOpen()"
  (onSubmit)="onCreateNoteSubmit($event)"
  (onCancel)="onCreateNoteCancel()">
</app-note-create-modal>

<app-note-link-modal
  [isOpen]="isNoteLinkModalOpen()"
  [notes]="allNotes$()"
  (onSelect)="onLinkNoteSelect($event)"
  (onCancel)="onLinkNoteCancel()">
</app-note-link-modal>
```

### 4. `webapp/src/app/pages/entity-detail/entity-detail.page.less`

Add styles for `.notes-card`, `.notes-card-header`, `.notes-card-btn-container`, `.note-row`, `.note-name`, `.no-notes`, mirroring the documents card styles. Follow the LESS style guide (4-space indent, kebab-case, max 2-3 nesting levels, Ant Design tokens).

## Implementation Notes / Open Questions

- The existing `NoteCreateModalComponent` is currently used from the notes list page; confirm its inputs/outputs match what we need (`isOpen` + `onSubmit` emitting `{ name, description, contentJson?, contentText? }`, and `onCancel`). If not, extend it with these I/O props rather than duplicating it.
- After inline-create, the user stays on the entity detail page (we do NOT navigate to the new note). The new note appears in the linked list immediately via the store.
- All state continues to flow through `NoteService` -> `NoteStore` (Signals). No direct store writes from the component.
- Follow TypeScript style guide: 4-space indent, single quotes, descriptive camelCase, signals suffixed `$`, handlers prefixed `onClick`/`on`.

## Test Plan

- Navigate to an entity record detail page; verify the new Notes card renders with empty state "No notes".
- Click "+ New", fill in the create-note modal, submit; verify the note appears in the linked list and at `/notes`.
- Open the new note from `/notes/:id`; verify the linked record shows in its "Linked Records" sidebar.
- Click "+ Link Existing"; pick a note; verify it is added to the linked list.
- Click the unlink (disconnect) icon on a row; verify the note disappears from the list and the link is removed from the note's `linkedRecords`.
- Reload the page; verify linked notes persist (backend round-trip via `noteService.loadAll`).
