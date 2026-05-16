# Plan: Link Existing Document

## Overview

Next to the existing "+ Upload" button on the Documents page, add a second button: "+ Link Existing". Clicking it opens a modal where the user can search existing documents by name and select one to "link" — meaning navigate to its detail page (or some other action). 

> NOTE: At this stage "linking" means selecting an already-uploaded document from the list. The primary use-case expected here is finding a document that was already uploaded and associating it with the current context. If the feature eventually wires into entity-record linking, that can be a follow-up.

For now the feature is scoped to: **open a modal, search/filter existing documents, select one, close the modal and emit the chosen document to the parent page.**

---

## What Changes

### 1. New Component — `document-link-modal`

Create a new sub-component alongside `document-upload-modal`:

```
webapp/src/app/pages/documents/document-link-modal/
    document-link-modal.component.ts
    document-link-modal.component.html
    document-link-modal.component.less
```

**Inputs / Outputs:**
- `@Input() isOpen: boolean`
- `@Input() documents: Document[]` — the full list of documents passed in from the parent
- `@Output() onSelect = new EventEmitter<Document>()`
- `@Output() onCancel = new EventEmitter<void>()`

**Internal state:**
- `searchQuery = ''` — bound to a search input
- `get filteredDocuments()` — computed getter that filters `documents` by `searchQuery` (case-insensitive name match)

**Template:**
- `nz-modal` with title "Link Existing Document"
- Search `input` (nz-input) at the top for filtering
- `nz-table` or simple list showing filtered documents (columns: Name, Original File, Created At)
- Each row has a "Select" button that emits `onSelect` with that document and resets the search
- Footer has a "Cancel" button

**On select:**
```ts
onClickSelect(document: Document): void {
    this.searchQuery = '';
    this.onSelect.emit(document);
}

onClickCancel(): void {
    this.searchQuery = '';
    this.onCancel.emit();
}
```

### 2. Update `documents.page.html`

Add the new button next to "+ Upload" and wire up the new modal:

```html
<button nz-button nzType="default" (click)="onClickLinkExisting()">+ Link Existing</button>
```

Add the modal at the bottom of the template:

```html
<app-document-link-modal
    [isOpen]="isLinkModalOpen"
    [documents]="documents$()"
    (onSelect)="onLinkSelect($event)"
    (onCancel)="onLinkCancel()">
</app-document-link-modal>
```

### 3. Update `documents.page.ts`

Add state and handlers:

```ts
isLinkModalOpen = false;

onClickLinkExisting(): void {
    this.isLinkModalOpen = true;
}

onLinkSelect(document: Document): void {
    this.isLinkModalOpen = false;
    this.router.navigate(['/documents', document.id]);
}

onLinkCancel(): void {
    this.isLinkModalOpen = false;
}
```

Import and add `DocumentLinkModalComponent` to the `imports` array.

---

## Files Changed / Created

| File | Action |
|---|---|
| `webapp/src/app/pages/documents/document-link-modal/document-link-modal.component.ts` | Create — modal component logic |
| `webapp/src/app/pages/documents/document-link-modal/document-link-modal.component.html` | Create — modal template |
| `webapp/src/app/pages/documents/document-link-modal/document-link-modal.component.less` | Create — modal styles |
| `webapp/src/app/pages/documents/documents.page.html` | Edit — add "+ Link Existing" button and modal element |
| `webapp/src/app/pages/documents/documents.page.ts` | Edit — add `isLinkModalOpen`, `onClickLinkExisting`, `onLinkSelect`, `onLinkCancel`, import new component |

---

## No Backend Changes Required

This feature is purely a frontend UX addition. It uses the documents already loaded in the store — no new IPC calls, no new DB tables.
