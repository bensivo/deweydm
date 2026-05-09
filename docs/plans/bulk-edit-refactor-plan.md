# Bulk Edit Refactor Plan

Follow-up to the `bulk-edit` branch review. Findings reference `.claude/skills/review-feature/refactor-opportunities.md`.

## Scope

Accepted findings: #1, #2, #4, #5, #13 (partial), #15, #16.
Deferred (will fall out of #1): #6, #7.
Skipped: #3, #8, #9, #10, #11, #12, #14.

---

## 1. Extract `BulkSpreadsheetComponent` (covers #1, #6, #7, #13)

Create `webapp/src/app/components/bulk-spreadsheet/`:

- `bulk-spreadsheet.component.ts`
  - Inputs: `fields: EntityField[]`, `rows: { id?: string; data: Record<string,string> }[]`
  - Output: `(rowsChange)` emitting updated rows
  - Owns: cell editors (short text, long text, number, reference, reference-list, option), tab/arrow key navigation, ref-list parsing via `ReferenceListService`.
  - Replace `document.querySelector` focus management with `@ViewChildren('cellInput')` + `QueryList` indexing (#7).
- `bulk-spreadsheet.component.html` — table template lifted from current bulk-edit/bulk-create.
- `bulk-spreadsheet.component.less` — table/cell styles lifted verbatim. (Resolves #13 fully; partial `_bulk-spreadsheet.less` step is skipped because the component lands at the same time.)

Refactor both pages to thin wrappers:
- `entity-bulk-create.page.ts/html` — keep seed-empty-rows logic + Save (calls `bulkCreateRecords`).
- `entity-bulk-edit.page.ts/html` — keep id-based load + Save (calls `bulkUpdateRecords`).

### Field-selection modal (#6)

Extract `webapp/src/app/components/field-selection-modal/`:
- Inputs: `[fields]`, `[isOpen]`, `[committed]`
- Output: `(commit)`
- Wire bulk-edit, bulk-create, and entity-list column modal to use it.

---

## 2. Migrate bulk-create to `ReferenceListService` (#2)

In `entity-bulk-create.page.ts`:
- Remove inline `refListValueCache` map (line ~52) and the `getRefListValues` / `setRefListValues` methods that use it (lines ~153-172).
- Use `ReferenceListService.parseRefList` / `stringifyRefList` instead.

This step becomes trivial once the spreadsheet component (#1) is in place — bulk-create no longer owns ref-list logic at all.

---

## 3. Fix route subscription pattern in `entity-bulk-edit.page.ts` (#4, #5)

In `ngOnInit` (lines 70-94):
- Replace the nested `route.params.subscribe` → `route.queryParams.subscribe` with a single read using `route.snapshot.params` and `route.snapshot.queryParamMap`.
- Move entity resolution into an `effect()` that reacts to `entityKeySignal()` and `entityService.entities$()` so it works whether entities are already loaded or load asynchronously (#5). Guard the redirect with `if (entities.length === 0) return;` so it only fires once entities have actually resolved.
- Drop the now-unused `Subscription` field.

Apply the same pattern to `entity-bulk-create.page.ts` for parity.

---

## 4. Fix window keydown/keyup listener leak in `entity-list.page.ts` (#15)

In `entity-list.page.ts` (lines 167-176):
- Replace `window.addEventListener('keydown', ...)` and `('keyup', ...)` with `@HostListener('window:keydown', ['$event'])` / `@HostListener('window:keyup', ['$event'])` methods on the component.
- Remove the matching cleanup paths (none currently exist — that's the leak).

---

## 5. Move plan file (#16)

- `git mv webapp/docs/plans/bulk-edit-plan.md docs/plans/bulk-edit-plan.md`
- Verify nothing references the old path.

---

## Out of scope (skipped)

- #3 setCellValue cloning — accepted current mutation pattern.
- #8 bulkUpdateRecords sequential awaits — leave as-is.
- #9 silent dropping of missing record ids — leave silent.
- #10 saving/loading state during bulk save.
- #11 BulkEditRow model + typed ElectronApi global.
- #12 dead Add-to-List comment + dead `*ngIf` guard cleanup.
- #14 commented-out block in `getRefListItems`.

---

## Suggested order of work

1. Move plan file (#16) — trivial, removes inconsistency before further commits.
2. Fix entity-list listener leak (#15) — small, isolated.
3. Fix bulk-edit route subscription / entity$ resolution (#4, #5).
4. Extract `BulkSpreadsheetComponent` (#1, #7, #13).
5. Migrate bulk-create to spreadsheet component + `ReferenceListService` (#2).
6. Extract `FieldSelectionModalComponent` (#6); wire bulk-edit, bulk-create, entity-list.
