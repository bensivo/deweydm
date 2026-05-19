# Plan: Note Create Modal

## Summary
Currently, clicking "+ New" on the Notes page (`src/app/pages/notes/notes.page.ts`) immediately
creates a new note named "Untitled" and navigates to it. We want to instead open a modal where
the user can set the note's name (and optionally other metadata) before the note is created.
The pattern should mirror the document upload flow on the Documents page
(`src/app/pages/documents/documents.page.ts`), which uses a co-located modal component
(`document-upload-modal`).

## User Journey
1. User clicks "+ New" on the Notes page.
2. A modal opens with an input field for the note's name.
3. User enters a name and clicks "Create" (disabled if name is blank).
4. The modal closes, the note is created via `NoteService.createNote`, and the user is
   navigated to `/notes/:id`.
5. User can click "Cancel" to dismiss the modal without creating a note.

## Files to Create

### `src/app/pages/notes/note-create-modal/note-create-modal.component.ts`
A new modal component following the same pattern as `DocumentUploadModalComponent`.

- Exports interface `NoteCreateData { name: string; }`.
- `@Input() isOpen: boolean`
- `@Output() onSubmit = new EventEmitter<NoteCreateData>()`
- `@Output() onCancel = new EventEmitter<void>()`
- Internal field `nameValue: string`.
- Getter `isSubmitDisabled` returns true when `nameValue.trim()` is empty.
- `onClickSubmit()`: validates, emits `onSubmit` with trimmed name, resets the form.
- `onClickCancel()`: resets the form, emits `onCancel`.
- Private `resetForm()`.
- Imports: `CommonModule`, `FormsModule`, `NzModalModule`, `NzButtonModule`,
  `NzInputModule`, `NzFormModule`.

### `src/app/pages/notes/note-create-modal/note-create-modal.component.html`
Mirror the structure of `document-upload-modal.component.html`:
- `<nz-modal>` bound to `isOpen` with title "New Note".
- One `nz-form-item` containing the name input (required).
- Footer: "Cancel" and "Create" buttons. "Create" is `nzType="primary"` and disabled when
  `isSubmitDisabled` is true.

### `src/app/pages/notes/note-create-modal/note-create-modal.component.less`
Empty/minimal placeholder file for style encapsulation, matching the documents modal.

## Files to Edit

### `src/app/pages/notes/notes.page.ts`
- Add `isCreateModalOpen = false;` field.
- Import `NoteCreateModalComponent` and `NoteCreateData` and add the component to `imports`.
- Replace existing `onClickNew()` body. New behavior: just set
  `this.isCreateModalOpen = true;`.
- Add `async onCreateSubmit(data: NoteCreateData)`: calls
  `this.noteService.createNote(data.name, '', '', '')`, closes the modal, navigates to
  `/notes/:id`. Error handling matches the current implementation (log + `nzMessageService.error`).
- Add `onCreateCancel()`: sets `isCreateModalOpen = false`.

### `src/app/pages/notes/notes.page.html`
- The existing "+ New" button already calls `onClickNew()` — no change needed there.
- Append the modal at the bottom of the template, similar to documents page:
  ```html
  <app-note-create-modal
      [isOpen]="isCreateModalOpen"
      (onSubmit)="onCreateSubmit($event)"
      (onCancel)="onCreateCancel()">
  </app-note-create-modal>
  ```

## Style / Pattern Notes
- Follow the TypeScript style guide: 4-space indent, single quotes, semicolons, camelCase
  with descriptive names, event handlers prefixed with `on`.
- Follow Angular conventions in this repo: external `.html` and `.less`, pages keep business
  logic out of the template, services own data mutations.
- Reuse NG-Zorro components (`nz-modal`, `nz-form-item`, `nz-input`, `nz-button`).
- No new dependencies.

## Out of Scope
- Adding additional fields (description, tags) to the create flow — name only for now.
- Changing the note detail page or `NoteService.createNote` signature.
- Backend changes.

## Verification
- Build the webapp.
- Manually click "+ New" on the Notes page, confirm modal opens, name input is required,
  Cancel closes the modal without creating, submitting creates a note with the entered name
  and navigates to the detail page.
