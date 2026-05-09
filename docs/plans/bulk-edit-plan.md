# Bulk Edit Feature — Plan

## Goal
Allow users to select multiple records on the entity list page, click "Bulk Edit", and edit them in a spreadsheet-like view (mirroring the existing bulk-create UX) pre-populated with current record data. Saving updates all rows.

This plan mirrors the bulk-create implementation closely. The page is a near-clone of `EntityBulkCreatePageComponent` with two functional differences: rows are seeded from existing records, and Save calls `updateRecord` instead of `createRecord`.

## Approach
- Add a new route `/entity-bulk-edit/:key` resolving to a new `EntityBulkEditPageComponent`.
- Pass selected record IDs via query param `?ids=id1,id2,...` (bookmarkable, refresh-safe-ish, no router state coupling).
- Reuse the existing selection mechanism in `EntityListPageComponent` (`selectedRecordIdsSignal`).
- Do not extract a shared component yet; copy bulk-create and adapt. Keep changes localized.

## Files to create

### `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts`
Mirror `EntityBulkCreatePageComponent` with the following changes:
- Read `ids` from `route.queryParams`; split on `,`; store in a `recordIdsSignal: signal<string[]>([])`.
- Replace `bulkDataSignal` initialization: instead of `[{}]`, populate from selected records:
  - `bulkDataSignal = signal<{ id: string; data: Record<string, string> }[]>([])`
  - In `ngOnInit`, after resolving entity and ids, look up each record via `entityRecordService.records$()` (or a new helper `getRecord(id)`) and seed rows as `{ id: record.id, data: { ...record.data } }`.
  - If a record id can't be resolved, skip it (don't crash).
- Field-selection modal default: select **all non-backlink fields** by default (vs. just display name). Editing benefits from seeing all data.
- `getCellValue` / `setCellValue` operate on `row.data[fieldId]`.
- `onClickAddRow` / `onClickRemoveRow`: removed. Bulk edit operates on a fixed set of selected records — no row add/remove. (Tab-to-new-row behavior in `onKeyDown` also removed; tabbing past the last cell does nothing or wraps as natural browser behavior.)
- `onClickSave`:
  - For each row, call `entityRecordService.updateRecord(row.id, row.data)`.
  - Do NOT filter empty rows — bulk-edit can legitimately clear field values.
  - Navigate back to `/entity/:key`.
- Header text: "Bulk Edit {entity.pluralName}" instead of bulk-create equivalent.

### `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.html`
Copy of bulk-create template with these changes:
- Page title says "Bulk Edit".
- Save button label "Save All".
- Remove the "Add Row" button and per-row "Remove" button (rows are fixed to the selection).
- Cell input bindings unchanged in shape but reference `bulkDataSignal()[i].data[fieldId]` via `getCellValue` / `setCellValue` (signature unchanged).

### `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.less`
Copy bulk-create styles verbatim.

## Files to modify

### `webapp/src/app/app.routes.ts`
Add:
```ts
import { EntityBulkEditPageComponent } from './pages/entity-bulk-edit/entity-bulk-edit.page';
// ...
{ path: 'entity-bulk-edit/:key', component: EntityBulkEditPageComponent },
```

### `webapp/src/app/pages/entity-list/entity-list.page.ts`
Add a handler:
```ts
onClickBulkEditButton(): void {
    const entity = this.entity$();
    if (!entity) return;
    const ids = Array.from(this.selectedRecordIdsSignal());
    if (ids.length === 0) return;
    this.router.navigate(
        ['/entity-bulk-edit', generateEntityKey(entity.name)],
        { queryParams: { ids: ids.join(',') } }
    );
}
```

### `webapp/src/app/pages/entity-list/entity-list.page.html`
Add a "Bulk Edit" button in the toolbar near "Add to List", disabled when `selectedRecordIdsSignal().size === 0`:
```html
<button
    nz-button
    nzSize="large"
    (click)="onClickBulkEditButton()"
    [disabled]="selectedRecordIdsSignal().size === 0">
    Bulk Edit
</button>
```

## Data flow
1. User checks N rows on entity list (existing `selectedRecordIdsSignal`).
2. User clicks "Bulk Edit" → navigate to `/entity-bulk-edit/:key?ids=a,b,c`.
3. `EntityBulkEditPageComponent.ngOnInit`:
   - Resolves entity by route key.
   - Reads `ids` query param.
   - Seeds `bulkDataSignal` from `entityRecordService.records$()` filtered to those ids, copying `data` shallowly.
   - Defaults all non-backlink fields visible.
4. User edits cells → `setCellValue` updates the row's `data` map (immutable copy of the rows array, mutate the target row's data via spread).
5. User clicks "Save All" → loops over rows, calls `entityRecordService.updateRecord(row.id, row.data)`, navigates back to entity list.

## Edge cases / notes
- Empty `ids` param: if zero records resolved, render an empty state and a back button (don't redirect — the user might want to see the message).
- Stale ids (record deleted between selection and edit): silently skip rows that can't be resolved.
- Reference-list cache: keep the same `refListValueCache` pattern as bulk-create to avoid infinite change detection.
- Don't introduce a shared bulk-spreadsheet component yet. After this lands and we see the duplication clearly, a follow-up can extract it. (Per user direction: mirror closely first.)
- No new service methods needed — `entityRecordService.updateRecord(id, data)` already exists.

## Out of scope
- Bulk delete.
- Undo / change preview before save.
- Partial save / per-row error reporting (updateRecord is in-memory and won't fail under current architecture).
- Extracting shared spreadsheet component.

## Test plan (manual)
- Select 3 records on an entity list, click Bulk Edit, confirm all 3 appear pre-populated.
- Edit a few cells across rows, click Save All, confirm list reflects changes.
- Clear a field value and save → confirm the field is now empty (not skipped).
- Reference and reference-list cells render with correct dropdowns and existing selections.
- Bulk Edit button disabled when no rows selected.
- Navigating directly to `/entity-bulk-edit/:key` with no `ids` shows empty state.
