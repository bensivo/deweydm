# Fix: Pagination State Per Entity

## Problem

On the `entity-list` page, navigating from one entity (e.g. page 2 of "Accounts") to another entity that has fewer records causes broken/empty display. The root cause is that the `nz-table` component's internal `pageIndex` state is not reset when the route param changes to a different entity key.

Angular's router reuses the same component instance when navigating between routes of the same pattern (`/entity-list/:key`). Only `ngOnInit` runs logic on route param change (via `route.params.subscribe`), but the `nz-table`'s internal page index is never reset.

The fix is to:
1. Manage `pageIndex` explicitly as a component signal (instead of letting `nz-table` manage it internally)
2. Store the last-used page index per entity in a new `EntityListUiStore` so navigating away and back restores the correct page (in-memory only, does not persist across app reloads)
3. When switching to a different entity, restore its previously saved page index (or default to 1)

---

## Implementation Plan

### 1. Create `EntityListUiStore`

Create a new file `webapp/src/app/store/entity-list-ui.store.ts`:

```ts
import { Injectable, signal } from '@angular/core';

/**
 * Stores transient UI state for the entity-list page.
 * State is kept in memory only and is not persisted across app reloads.
 */
@Injectable({ providedIn: 'root' })
export class EntityListUiStore {
    private pageIndexByEntityKeySignal = signal<Record<string, number>>({});
    public pageIndexByEntityKey$ = this.pageIndexByEntityKeySignal.asReadonly();

    getPageIndex(entityKey: string): number {
        return this.pageIndexByEntityKeySignal()[entityKey] ?? 1;
    }

    setPageIndex(entityKey: string, pageIndex: number): void {
        this.pageIndexByEntityKeySignal.update(state => ({
            ...state,
            [entityKey]: pageIndex,
        }));
    }
}
```

### 2. Add `pageIndexSignal` and `pageSizeSignal` to `EntityListPageComponent`

In `webapp/src/app/pages/entity-list/entity-list.page.ts`:

- Inject `EntityListUiStore`
- Add two new signals to the component class:
  ```ts
  pageIndexSignal = signal<number>(1);
  pageSizeSignal = signal<number>(10);
  ```

### 3. Restore `pageIndexSignal` from the store on entity key change

Inside the `route.params.subscribe` callback in `ngOnInit`, after setting `this.entityKeySignal.set(key)`, read the saved page index for the incoming entity key from the store and set it on the signal:

```ts
this.pageIndexSignal.set(this.entityListUiStore.getPageIndex(key));
```

This ensures navigating back to an entity restores the page the user was on, and navigating to a new entity starts at page 1.

### 4. Persist `pageIndexSignal` changes to the store

Add a handler method `onPageIndexChange` that both updates the signal and writes to the store:

```ts
onPageIndexChange(pageIndex: number): void {
    this.pageIndexSignal.set(pageIndex);
    this.entityListUiStore.setPageIndex(this.entityKeySignal(), pageIndex);
}
```

Use this instead of calling `pageIndexSignal.set($event)` directly from the template.

### 5. Bind `nz-table` pagination to the component signals

In `webapp/src/app/pages/entity-list/entity-list.page.html`, update the `nz-table` element:

Before:
```html
<nz-table
  #recordTable
  [nzData]="filteredAndSortedRecords$()"
  [nzShowPagination]="filteredAndSortedRecords$().length > 10"
  [nzShowSizeChanger]="true"
  [nzPageSizeOptions]="[10, 25, 50, 100]"
  nzSize="small"
  class="records-table">
```

After:
```html
<nz-table
  #recordTable
  [nzData]="filteredAndSortedRecords$()"
  [nzShowPagination]="filteredAndSortedRecords$().length > 10"
  [nzShowSizeChanger]="true"
  [nzPageSizeOptions]="[10, 25, 50, 100]"
  [nzPageIndex]="pageIndexSignal()"
  (nzPageIndexChange)="onPageIndexChange($event)"
  [nzPageSize]="pageSizeSignal()"
  (nzPageSizeChange)="pageSizeSignal.set($event)"
  nzSize="small"
  class="records-table">
```

---

## Files to Edit

| File | Change |
|------|--------|
| `webapp/src/app/store/entity-list-ui.store.ts` | **New file** — store holding `pageIndex` per entity key, in memory only |
| `webapp/src/app/pages/entity-list/entity-list.page.ts` | Inject `EntityListUiStore`; add `pageIndexSignal` and `pageSizeSignal` signals; restore `pageIndexSignal` from store on route param change; add `onPageIndexChange` handler that writes to store |
| `webapp/src/app/pages/entity-list/entity-list.page.html` | Bind `nzPageIndex` and `nzPageSize` to the new signals; wire `(nzPageIndexChange)` to `onPageIndexChange` |

---

## Notes

- State lives in a Signal-based store (`EntityListUiStore`), consistent with the project's three-layer architecture.
- No localStorage is used — this state is intentionally ephemeral (survives in-page navigation but not app reloads).
- `pageSizeSignal` remains local to the component for now; only `pageIndex` needs per-entity persistence since that's what causes the broken display.
