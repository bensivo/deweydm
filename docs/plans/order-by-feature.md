# Order By Feature Plan

## Overview

Replace the existing single-column sort (sortFieldIdSignal / sortOrderSignal) in the entity-list and view pages with a multi-column "Order By" panel. The UX pattern mirrors the existing Filters panel: a toolbar toggle button reveals a collapsible section containing rows, each with a field selector and an asc/desc selector. Multiple rows are supported; records are sorted by the first row, then by subsequent rows for ties.

---

## New Model: `order-by.model.ts`

**File:** `webapp/src/app/models/order-by.model.ts`

```ts
export type SortOrder = 'asc' | 'desc';

export interface OrderBy {
    id: string;
    entityId: string;
    fieldId: string;
    order: SortOrder;
}
```

---

## New Service: `order-by.service.ts`

**File:** `webapp/src/app/services/order-by.service.ts`

Mirrors the structure of `FilterService`. Manages an array of `OrderBy` rows, scoped by current entity id.

### State signals
- `private orderByRowsSignal = signal<OrderBy[]>([])`
- `private nextOrderByIdSignal = signal<number>(0)`
- `private currentEntityIdSignal = signal<string>('')`

### Public methods
- `setCurrentEntity(entityId: string): void` — update `currentEntityIdSignal`
- `getOrderByRows(): OrderBy[]` — return rows filtered to current entity
- `getOrderByRowsSignal()` — return `computed(() => ...)` filtered to current entity (for reactive template binding)
- `addOrderByRow(fields: EntityField[]): void` — append a new row with defaults (first field, 'asc')
- `removeOrderByRow(rowId: string): void` — remove by id
- `updateOrderByRow(rowId: string, updates: Partial<OrderBy>): void` — patch a row
- `applyOrderByToRecords(records: EntityRecord[], orderByRows: OrderBy[], entity: Entity): EntityRecord[]` — sort records using each row in order, numeric-aware

### Sorting logic in `applyOrderByToRecords`
```
for each row (in array order):
    sort by row.fieldId asc or desc
    use stable multi-key sort: reduce over rows, applying localeCompare / numeric compare
```

Implementation: use a single `.sort()` with a comparator that iterates through all active rows in sequence, returning the first non-zero comparison.

---

## Changes to `entity-list.page.ts`

**File:** `webapp/src/app/pages/entity-list/entity-list.page.ts`

### Remove
- `sortFieldIdSignal`
- `sortOrderSignal`
- `onColumnHeaderClick(fieldId)` method
- `getColumnSortOrder(fieldId)` method
- The sort block inside `filteredAndSortedRecords$` computed

### Add
- Inject `OrderByService`
- `isOrderByVisibleSignal = signal<boolean>(false)`
- `getOrderByRowsSignal()` — delegates to `orderByService.getOrderByRowsSignal()`
- `onClickOrderByToggleButton()` — toggle `isOrderByVisibleSignal`
- `onClickAddOrderByButton()` — call `orderByService.addOrderByRow(entity.fields)`
- `onClickRemoveOrderByButton(rowId)` — call `orderByService.removeOrderByRow(rowId)`
- `onOrderByFieldChange(rowId, newFieldId)` — call `orderByService.updateOrderByRow(rowId, { fieldId: newFieldId })`
- `onOrderByDirectionChange(rowId, newOrder)` — call `orderByService.updateOrderByRow(rowId, { order: newOrder })`

### Update `filteredAndSortedRecords$`
Replace the sort block with:
```ts
const orderByRows = this.orderByService.getOrderByRows();
filtered = this.orderByService.applyOrderByToRecords(filtered, orderByRows, entity!);
```

### Update `ngOnInit`
After setting the current entity in `filterService`, also call:
```ts
this.orderByService.setCurrentEntity(entity.id);
const existingRows = this.orderByService.getOrderByRows();
existingRows.forEach(row => this.orderByService.removeOrderByRow(row.id));
```

---

## Changes to `entity-list.page.html`

**File:** `webapp/src/app/pages/entity-list/entity-list.page.html`

### Toolbar button (alongside the Filters button)
```html
<button nz-button nzSize="large" (click)="onClickOrderByToggleButton()">
  <i nz-icon nzType="sort-ascending" nzTheme="outline"></i>
  Order By
  <div class="toolbar-filters-badge" *ngIf="getOrderByRowsSignal()().length > 0">
    <span class="badge">{{ getOrderByRowsSignal()().length }}</span>
  </div>
</button>
```

### Order By section (after the existing Filters section)
```html
<div class="filters-section" *ngIf="isOrderByVisibleSignal()">
  <div class="filter-rows">
    <div *ngFor="let row of getOrderByRowsSignal()()" class="filter-row">
      <!-- Field selector -->
      <nz-select
        class="filter-field-select"
        [ngModel]="row.fieldId"
        (ngModelChange)="onOrderByFieldChange(row.id, $event)">
        <nz-option *ngFor="let field of entity$()!.fields"
          [nzLabel]="field.name"
          [nzValue]="field.id">
        </nz-option>
      </nz-select>

      <!-- Asc / Desc selector -->
      <nz-select
        class="filter-operator-select"
        [ngModel]="row.order"
        (ngModelChange)="onOrderByDirectionChange(row.id, $event)">
        <nz-option nzLabel="Ascending" nzValue="asc"></nz-option>
        <nz-option nzLabel="Descending" nzValue="desc"></nz-option>
      </nz-select>

      <!-- Remove button -->
      <button nz-button nzType="text" nzDanger (click)="onClickRemoveOrderByButton(row.id)">
        <i nz-icon nzType="close" nzTheme="outline"></i>
      </button>
    </div>
  </div>
  <div class="filters-footer">
    <button nz-button nzType="default" (click)="onClickAddOrderByButton()">
      {{ getOrderByRowsSignal()().length > 0 ? '+ Add Another Sort' : '+ Add Sort' }}
    </button>
  </div>
</div>
```

### Table header
Remove the click handler and sort indicator from column headers (the `onColumnHeaderClick` binding and `sort-indicator` span). Column headers become non-clickable for sorting. The `.sortable-header` class and `.sorted` class can be removed or kept as a no-op.

---

## Changes to `view.page.ts`

**File:** `webapp/src/app/pages/view/view.page.ts`

Apply the exact same changes as `entity-list.page.ts`:
- Remove `sortFieldIdSignal`, `sortOrderSignal`, `onColumnHeaderClick`, `getColumnSortOrder`
- Inject `OrderByService`
- Add `isOrderByVisibleSignal` and the five order-by event handler methods
- Update `filteredAndSortedRecords$` to use `orderByService.applyOrderByToRecords`
- In `ngOnInit`, call `orderByService.setCurrentEntity` and clear existing rows

---

## Changes to `view.page.html`

**File:** `webapp/src/app/pages/view/view.page.html`

Apply the same template additions as `entity-list.page.html`: toolbar button and order-by section. Remove column header sort click handlers and sort indicators.

---

## Files Summary

| Action | File |
|--------|------|
| Create | `webapp/src/app/models/order-by.model.ts` |
| Create | `webapp/src/app/services/order-by.service.ts` |
| Edit   | `webapp/src/app/pages/entity-list/entity-list.page.ts` |
| Edit   | `webapp/src/app/pages/entity-list/entity-list.page.html` |
| Edit   | `webapp/src/app/pages/view/view.page.ts` |
| Edit   | `webapp/src/app/pages/view/view.page.html` |

No new stores are needed — `OrderByService` holds its own transient signal state the same way `FilterService` does.

---

## Implementation Notes

- Field types `backlink`, `reference`, and `reference-list` should be excluded from the Order By field dropdown (sorting by them is not meaningful). Filter the entity fields list to only include: `short-text`, `long-text`, `number`, `option`.
- The sort comparator should treat empty/missing field values as sorting last in ascending order.
- No persistence of order-by state is required for this feature.
