# Note Detail Page: Drawer Refactor Plan

## Goal
Refactor the note detail page so the rich-text note editor is the primary, immediately-visible content on the page. Move the existing two cards (note metadata/details and linked records) off the main page and into a single collapsible right-side panel using ng-zorro's `nz-drawer`. The drawer is closed by default so the editor gets full focus; users open it via a toggle button in the page header.

## Scope
Only edit files in `webapp/src/app/pages/note-detail/`:
- `note-detail.page.html`
- `note-detail.page.ts`
- `note-detail.page.less`

Do NOT edit:
- `note-detail/note-editor/*` (the editor component stays untouched)
- Any services, stores, models, or shared components

## Constraints
- Preserve ALL existing functionality: load note, edit/save metadata (name/description), save editor content, view/add/remove linked records, delete note, back navigation.
- Both the "Details" card and the "Linked Records" card go into the **same** `nz-drawer` (one drawer, stacked vertically inside).
- Drawer defaults to closed.
- Toggle button lives in the page header area, visible at all times while the note is loaded.
- Follow style guides:
  - TS: 4-space indent, single quotes, camelCase, `on...` event handlers, `Signal` suffix for signals where relevant, signal-based state (no observables).
  - LESS: 4-space indent, kebab-case classes, property ordering (position → box → display → visual), spacing in multiples of 4px, max 2-3 nesting levels.
  - Angular: components only read state and call methods; no business logic moves into the template/component. Since this refactor is purely presentational, no service/store changes are needed.

## Implementation Details

### 1. `note-detail.page.ts`
- Add `NzDrawerModule` import from `ng-zorro-antd/drawer` and include it in the `imports` array.
- Add a `isDrawerOpen` signal initialized to `false`:
  ```ts
  isDrawerOpen = signal(false);
  ```
- Add two handler methods:
  ```ts
  onClickOpenDrawer(): void {
      this.isDrawerOpen.set(true);
  }

  onClickCloseDrawer(): void {
      this.isDrawerOpen.set(false);
  }
  ```
- No changes to any other methods (`onClickEdit`, `onClickSaveMeta`, `onClickAddLink`, `onClickRemoveLink`, `onClickSaveContent`, `onClickDelete`, `onClickBack`, etc.) — they keep working as-is because their template bindings will simply live inside the drawer now.

### 2. `note-detail.page.html`
New structure (high level):
```
<div class="note-detail-page" *ngIf="!isLoading() && note()">
    <div class="page-header">
        <button Back />                                <!-- existing -->
        <h1 class="page-title">{{ note()!.name }}</h1> <!-- moved up into header row -->
        <div class="page-header-actions">
            <button "Details & Links" (click)=onClickOpenDrawer />
            <button Delete (popconfirm) />
        </div>
    </div>

    <!-- Editor is now the primary content, no longer nested under a section title -->
    <section class="editor-section">
        <div class="editor-header">
            <button Save (click)=onClickSaveContent />
        </div>
        <app-note-editor
            [initialContentJson]="note()!.contentJson"
            (contentChange)="onEditorContentChange($event)">
        </app-note-editor>
    </section>
</div>

<!-- Drawer holding both cards -->
<nz-drawer
    [nzVisible]="isDrawerOpen()"
    nzPlacement="right"
    nzTitle="Note Details"
    [nzWidth]="480"
    (nzOnClose)="onClickCloseDrawer()">
    <ng-container *nzDrawerContent>
        <!-- Metadata Card: existing markup moved verbatim -->
        <nz-card ...> ... </nz-card>

        <!-- Linked Records Card: existing markup moved verbatim -->
        <app-card title="Linked Records"> ... </app-card>
    </ng-container>
</nz-drawer>

<div *ngIf="isLoading()" class="loading-state">Loading...</div>
```

Specific moves:
- The `detail-header` block (page title + Delete button) is merged into `page-header` to keep the editor at the top of the body. Title stays as `h1.page-title`.
- The Delete button and the new "Details" toggle button sit in `page-header-actions` on the right side of the header row.
- The existing `<nz-divider>` separators between cards/editor are removed — the editor no longer needs visual separation from siblings since the cards are now in the drawer. A divider between the two cards inside the drawer is kept (or added) for visual separation.
- The "Content" section title (`<h2 class="section-title">Content</h2>`) is removed — the editor is now the page itself; a title is redundant. The Save button remains, right-aligned above the editor.
- All bindings (`[(ngModel)]`, `(click)`, `*ngIf`, `*ngFor`, etc.) inside the moved cards are preserved exactly as they are today.

### 3. `note-detail.page.less`
- Update `.page-header` to be a single row with `display: flex; justify-content: space-between; align-items: center; gap: 16px;` so Back / title / actions sit on one line.
- Add `.page-header-actions { display: flex; gap: 8px; }`.
- Remove the now-unused `.detail-header` block (title moved into `.page-header`).
- Remove the `max-width: 640px` constraint on `.metadata-card` since the drawer body provides its own width; keep `margin-bottom: 16px` so it spaces away from the Linked Records card inside the drawer.
- Keep `.editor-section`, `.field-row`, `.linked-record-item`, `.add-link-row`, `.no-links`, `.loading-state`, and `.section-title` styles intact (still used inside the drawer / editor).
- No drawer-specific overrides should be needed; ng-zorro defaults are fine. If the add-link row feels cramped at 480px width, optionally reduce `.entity-select` / `.record-select` `min-width` from `180px` to `140px`.

## Verification Checklist
- [ ] Page loads and shows editor as the first/largest element below the page header.
- [ ] Drawer is closed on first render.
- [ ] "Details" button opens drawer; close icon / mask click closes it.
- [ ] Inside drawer: Edit/Cancel/Save metadata works; Name and Description update and persist.
- [ ] Inside drawer: Linked records list renders, Add link works, Unlink (disconnect) works.
- [ ] Editor Save button still saves content; success message appears.
- [ ] Delete (popconfirm) still works and navigates back to `/notes`.
- [ ] Back button still navigates to previous location.
- [ ] No console errors; no TypeScript errors.
- [ ] Styles match guide (4-space indent, kebab-case, no deep nesting).

## Out of Scope
- Any backend / service / store changes.
- Auto-save in the editor.
- Persisting drawer open/closed state across navigations.
- Responsive / mobile layout tweaks for the drawer.
