# Bulk Edit Feature - Refactor Opportunities

Reviewed branch: `bulk-edit` (commits `b2847e0`, `c54fcab`).

Files in scope:
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts`
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.html`
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.less`
- `webapp/src/app/pages/entity-list/entity-list.page.ts` (bulk-edit handler)
- `webapp/src/app/pages/entity-list/entity-list.page.html` (button)
- `webapp/src/app/services/entity-record.service.ts` (`bulkUpdateRecords`, `getRecordsByIds`)
- `webapp/src/app/services/reference-list.service.ts` (new)
- `webapp/src/app/app.routes.ts` (route)

---

## 1. Heavy duplication between `EntityBulkEditPageComponent` and `EntityBulkCreatePageComponent`

**Issue.** The new page is a near-copy of `entity-bulk-create.page.ts/html/less`. Identical code includes: field-selection modal wiring, `visibleFields$`, `getCellValue`/`setCellValue`, `getReferenceOptions`, `getRefListValues`/`setRefListValues`, `onKeyDown` tab navigation, the spreadsheet table template, all LESS styles, and most imports. The plan accepted this as "mirror first, extract later" - but the duplication is now visible and the next bulk-* feature triples the cost.

**Files.**
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts` lines 38-204
- `webapp/src/app/pages/entity-bulk-create/entity-bulk-create.page.ts` lines 37-231
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.html`
- `webapp/src/app/pages/entity-bulk-create/entity-bulk-create.page.html`
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.less` (verbatim copy)

**Suggested fix.** Extract a reusable `BulkSpreadsheetComponent` under `components/bulk-spreadsheet/` taking inputs `fields: EntityField[]`, `rows: Record<string,string>[]`, output `(rowsChange)`. It owns the table template, cell editors, tab-key handling, and ref-list integration. Pages become thin wrappers handling seeding, save, and modal state.

---

## 2. Inconsistent reference-list handling between bulk-create and bulk-edit

**Issue.** Bulk-edit uses the new `ReferenceListService` (`parseRefList` / `stringifyRefList`); bulk-create still has its own inline `refListValueCache` map. Two implementations of the same concern now exist.

**Files.**
- `webapp/src/app/services/reference-list.service.ts` (new, has parse cache)
- `webapp/src/app/pages/entity-bulk-create/entity-bulk-create.page.ts` lines 52, 153-172
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts` lines 154-160

**Suggested fix.** Migrate `EntityBulkCreatePageComponent` to also use `ReferenceListService`; delete the inline cache. Falls out for free if #1 is done.

---

## 3. `EntityBulkEditPageComponent.setCellValue` mutates row `data` instead of cloning it

**Issue.** Clones the outer array but mutates the inner `data` object on the existing row. Breaks the immutability pattern and can cause subtle change-detection issues with signals.

**Files.**
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts` lines 142-148

```ts
const newData = [...bulkData];
if (!newData[rowIndex]) return;
newData[rowIndex].data[fieldId] = value;   // mutates in place
this.bulkDataSignal.set(newData);
```

**Suggested fix.** Replace the target row with a new object: `newData[rowIndex] = { ...newData[rowIndex], data: { ...newData[rowIndex].data, [fieldId]: value } };`.

---

## 4. Nested `subscribe` on route observables

**Issue.** `ngOnInit` subscribes to `route.params` and inside that callback subscribes to `route.queryParams`. No `takeUntil`/destroy - leak. Also contradicts the project's signal-first guidance.

**Files.**
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts` lines 70-94

**Suggested fix.** Use `route.snapshot.params` / `route.snapshot.queryParamMap` for one-shot reads, or `combineLatest` with a single subscription tied to a `DestroyRef`. Better: convert to `toSignal()` for consistency with `CLAUDE.md`'s signal-only state policy.

---

## 5. `entity$` is read inside `ngOnInit` immediately after setting the key signal

**Issue.** `this.entityKeySignal.set(key); const entity = this.entity$();` reads a `computed` synchronously after writing the dependency. Works only because `entityService.entities$()` is already populated; if entities load asynchronously, the page will redirect to `/`. Copied from bulk-create.

**Files.**
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts` lines 72-77

**Suggested fix.** Use an `effect()` that reacts to both signals, or guard with `if (entities.length === 0) return;` and let a later run resolve.

---

## 6. Field-selection modal logic duplicated across pages

**Issue.** `onClickFieldsButton`, `onConfirmFields`, `onCancelFields`, `onTogglePendingField`, `isPendingFieldVisible`, `isFieldSelectable` are duplicated verbatim from bulk-create (and similar to entity-list's column modal).

**Files.**
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts` lines 106-135
- `webapp/src/app/pages/entity-bulk-create/entity-bulk-create.page.ts` lines 93-122
- `webapp/src/app/pages/entity-list/entity-list.page.ts` (`onClickColumnsButton`, etc.)

**Suggested fix.** Extract a `FieldSelectionModalComponent` under `components/` taking `[fields]`, `[isOpen]`, `[committed]` and emitting `(commit)`. `ModalState` already abstracts open/pending/committed - the UI is the missing piece.

---

## 7. `onKeyDown` uses `document.querySelector` for focus management

**Issue.** Direct DOM querying via `data-row` / `data-field-index` attributes inside a component method is brittle and fights Angular. Bulk-edit and bulk-create versions also subtly diverge: bulk-edit returns early on last-cell/last-row before `event.preventDefault()`; bulk-create calls `preventDefault` first.

**Files.**
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts` lines 162-193
- `webapp/src/app/pages/entity-bulk-create/entity-bulk-create.page.ts` lines 174-209

**Suggested fix.** Use `@ViewChildren('cellInput')` to collect inputs, then index into the resulting `QueryList`. Falls into the spreadsheet component (#1).

---

## 8. `bulkUpdateRecords` is sequential `await` over `updateRecord`

**Issue.** N IPC calls in serial. For 50 records that's 50 round-trips. No error handling - if call 26 throws, calls 1-25 already persisted with no feedback or rollback.

**Files.**
- `webapp/src/app/services/entity-record.service.ts` lines 71-75

**Suggested fix.** Either (a) add a true bulk IPC endpoint `entityRecordBulkUpdate(rows)` so the backend processes in one transaction, or (b) `Promise.all` if order doesn't matter, or (c) keep sequential but try/catch per row and surface failures. Option (a) is the right long-term fix.

---

## 9. `getRecordsByIds` silently drops missing ids

**Issue.** When a record id doesn't resolve it's dropped without signal. The user might select 5 records, click Bulk Edit, and silently get a 4-row spreadsheet.

**Files.**
- `webapp/src/app/services/entity-record.service.ts` lines 83-87
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts` lines 90-92

**Suggested fix.** Page compares `ids.length` to `records.length`; on mismatch, show an `nz-alert` warning.

---

## 10. No saving / loading state during bulk save

**Issue.** `onClickSave` awaits `bulkUpdateRecords` then navigates synchronously. No loading indicator, no disabled state on inputs - the user sees a frozen UI for large saves.

**Files.**
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts` lines 195-203

**Suggested fix.** Add `isSavingSignal = signal(false)`, toggle around the await, bind to `[nzLoading]` on the Save button and `[disabled]` on inputs.

---

## 11. Type-safety / typing gaps

**Issue.**
- `bulkDataSignal` row shape `{ id: string; data: Record<string, string> }[]` is declared inline. Drift-prone if a third use site appears.
- `(window as any).electronApi` repeated in the service (pre-existing, but more uses now).

**Files.**
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.ts` line 52
- `webapp/src/app/services/entity-record.service.ts` lines 37, 50, 62, 95

**Suggested fix.** Define `interface BulkEditRow { id: string; data: Record<string, string>; }` in `models/`. Add a typed `ElectronApi` global declaration in a `.d.ts` to drop the `as any` casts.

---

## 12. Toolbar bulk-edit button: dead guard, dead HTML

**Issue.** The "Bulk Edit" button uses `*ngIf="selectedRecordIdsSignal().size > 0"` so the `if (ids.length === 0) return` guard in the handler is dead code. The toolbar still has a large commented-out "Add to List" block.

**Files.**
- `webapp/src/app/pages/entity-list/entity-list.page.html` lines 30-39 (commented), 48-54 (button)
- `webapp/src/app/pages/entity-list/entity-list.page.ts` lines 197-206

**Suggested fix.** Delete the commented-out "Add to List" block (or restore it). Pick one pattern for "needs selection" buttons - either always-visible-disabled (more discoverable) or hidden-until-valid - and apply consistently.

---

## 13. LESS file is a verbatim copy of bulk-create

**Issue.** `entity-bulk-edit.page.less` (126 lines) is identical to the bulk-create LESS. Style drift now possible.

**Files.**
- `webapp/src/app/pages/entity-bulk-edit/entity-bulk-edit.page.less`
- `webapp/src/app/pages/entity-bulk-create/entity-bulk-create.page.less`

**Suggested fix.** When the spreadsheet component is extracted (#1), the LESS moves with it. Interim: lift shared rules into a `_bulk-spreadsheet.less` partial imported by both.

---

## 14. Dead/commented-out code in `entity-record.service.ts`

**Issue.** `getRefListItems` ends with a 5-line commented-out block left from refactoring.

**Files.**
- `webapp/src/app/services/entity-record.service.ts` lines 201-205

**Suggested fix.** Delete the commented block.

---

## 15. Window keydown/keyup listeners on `EntityListPageComponent` leak

**Issue.** `ngOnInit` registers `window.addEventListener('keydown', ...)` and `keyup` and never removes them. Pre-existing but exacerbated by bulk-edit's reliance on multi-select; navigations leak listeners.

**Files.**
- `webapp/src/app/pages/entity-list/entity-list.page.ts` lines 167-176

**Suggested fix.** Use `@HostListener('window:keydown', ...)` and `@HostListener('window:keyup', ...)`, or store handler refs and remove in `ngOnDestroy`.

---

## 16. Plan file location inconsistency

**Issue.** `webapp/docs/plans/bulk-edit-plan.md` was added under `webapp/docs/`. `CLAUDE.md` documents top-level `docs/` as the docs home, and `docs/plans/` already exists.

**Files.**
- `webapp/docs/plans/bulk-edit-plan.md`
- `docs/plans/`

**Suggested fix.** Move the plan file to `docs/plans/` (or formally adopt the `webapp/docs/` path in `CLAUDE.md`).
