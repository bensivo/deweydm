# Plan: Documents Section on Entity Detail Page

## Feature Overview

Add a "Documents" section below the main fields card on the entity detail page. This section shows a list of documents linked to the current record, with an "Upload" button to upload and link a new document, and an "unlink" icon on each document row to remove the link.

## User Experience

- Below the fields card, a new `nz-card` titled "Documents" is always visible.
- The card lists all documents whose `linkedRecords` contains `{ entityId: entity.id, recordId: record.id }`.
- Each row shows the document name and a small unlink (scissors / disconnect) icon button on the right.
- Clicking unlink calls `DocumentService.removeLink(documentId, entityId, recordId)`.
- An "+ Upload" button in the card header opens the existing `DocumentUploadModalComponent`.
- On upload submit, call `DocumentService.createDocument(...)` then `DocumentService.addLink(...)` to link the new document to this record.
- If no documents are linked, show a short "No documents" empty state.

## Files to Change

### `webapp/src/app/pages/entity-detail/entity-detail.page.ts`

1. **Inject** `DocumentService` in the constructor.
2. **Add computed signal** `linkedDocuments$` that filters `documentService.documents$()` by the current entity id + record id.
3. **Add signal** `isUploadModalOpen = signal(false)`.
4. **Add handlers**:
   - `onClickUploadDocument()` — sets `isUploadModalOpen` to true.
   - `async onUploadDocumentSubmit(data: DocumentUploadData)` — calls `documentService.createDocument(...)`, then `documentService.addLink(newDoc.id, entity.id, record.id)`, then closes the modal. Shows `NzMessageService` success/error toasts.
   - `onUploadDocumentCancel()` — closes the modal.
   - `async onClickUnlinkDocument(documentId: string)` — calls `documentService.removeLink(documentId, entity.id, record.id)`.
5. **Add imports** for `DocumentService`, `DocumentUploadModalComponent`, `DocumentUploadData`, `NzMessageService`, `NzIconModule`, `NzEmptyModule`.
6. **Call `documentService.loadAll()`** in `ngOnInit` (only if not already loaded — for now just always call it; it replaces the whole store, which is acceptable).

### `webapp/src/app/pages/entity-detail/entity-detail.page.html`

Add after the closing `</nz-card>` of the fields card and before the delete modal:

```html
<!-- Documents Section -->
<nz-card class="documents-card" [nzTitle]="documentCardTitle">
  <ng-template #documentCardTitle>
    <div class="documents-card-header">
      <span>Documents</span>
      <button nz-button nzType="primary" nzSize="small" (click)="onClickUploadDocument()">+ Upload</button>
    </div>
  </ng-template>

  <div *ngIf="linkedDocuments$().length === 0" class="no-documents">No documents</div>

  <div *ngFor="let doc of linkedDocuments$()" class="document-row">
    <a [routerLink]="['/documents', doc.id]" class="document-name">{{ doc.name }}</a>
    <button nz-button nzType="text" nzDanger nzSize="small"
            nz-tooltip nzTooltipTitle="Unlink document"
            (click)="onClickUnlinkDocument(doc.id)">
      <span nz-icon nzType="disconnect"></span>
    </button>
  </div>
</nz-card>

<app-document-upload-modal
  [isOpen]="isUploadModalOpen()"
  (onSubmit)="onUploadDocumentSubmit($event)"
  (onCancel)="onUploadDocumentCancel()">
</app-document-upload-modal>
```

### `webapp/src/app/pages/entity-detail/entity-detail.page.less`

Add styles below the existing `.fields-card` block:

```less
.documents-card {
    max-width: 640px;
    margin-top: 16px;

    .documents-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .no-documents {
        color: #8c8c8c;
        font-style: italic;
        font-size: 13px;
    }

    .document-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
            border-bottom: none;
        }

        .document-name {
            font-size: 13px;
            color: #1890ff;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }
}
```

## No New Files Needed

All logic is added directly to the existing entity-detail page. The `DocumentUploadModalComponent` is reused as-is. No new services, stores, or components are required.

## Key Implementation Notes

- `linkedDocuments$` is a `computed()` signal so it updates reactively when documents or the record change.
- `isUploadModalOpen` must be a `signal(false)` (not a plain boolean) to stay consistent with the existing `isDeleteConfirmModalOpen` pattern in this page.
- The unlink action does NOT delete the document — it only removes the link. The document remains on the Documents page.
- Import `NzIconModule` and `NzTooltipModule` from ng-zorro to support the disconnect icon and tooltip.
