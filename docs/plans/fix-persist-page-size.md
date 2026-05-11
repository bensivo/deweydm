# Fix: Persist Page Size Per Entity/View

## Problem

The `pageSizeSignal` on both `entity-list.page.ts` and `view.page.ts` is initialized to `10` and never restored. When a user changes the page size and then navigates away and back, it resets to 10 (the smallest option). The `EntityListPaginationStore` only tracks `pageIndex`, not `pageSize`.

---

## Implementation Plan

### 1. Add `pageSize` storage to `EntityListPaginationStore`

File: `webapp/src/app/store/entity-list-pagination.store.ts`

Add a second signal for page size alongside the existing page index signal:

```ts
private pageSizeByKeySignal = signal<Record<string, number>>({});
public pageSizeByKey$ = this.pageSizeByKeySignal.asReadonly();

getPageSize(key: string): number {
    return this.pageSizeByKeySignal()[key] ?? 10;
}

setPageSize(key: string, pageSize: number): void {
    this.pageSizeByKeySignal.update(state => ({
        ...state,
        [key]: pageSize,
    }));
}
```

### 2. Update `entity-list.page.ts`

File: `webapp/src/app/pages/entity-list/entity-list.page.ts`

In the `route.params.subscribe` callback (after setting `pageIndexSignal`), also restore page size:

```ts
this.pageSizeSignal.set(this.entityListPaginationStore.getPageSize(key));
```

Add a handler `onPageSizeChange` that persists the new page size to the store:

```ts
onPageSizeChange(pageSize: number): void {
    this.pageSizeSignal.set(pageSize);
    this.entityListPaginationStore.setPageSize(this.entityKeySignal(), pageSize);
}
```

### 3. Update `entity-list.page.html`

File: `webapp/src/app/pages/entity-list/entity-list.page.html`

Change the `(nzPageSizeChange)` binding from a direct signal set to the new handler:

```html
(nzPageSizeChange)="onPageSizeChange($event)"
```

### 4. Update `view.page.ts`

File: `webapp/src/app/pages/view/view.page.ts`

In the `route.params.subscribe` callback (after setting `pageIndexSignal`), also restore page size:

```ts
this.pageSizeSignal.set(this.entityListPaginationStore.getPageSize(viewId));
```

Add a handler `onPageSizeChange` that persists the new page size to the store:

```ts
onPageSizeChange(pageSize: number): void {
    this.pageSizeSignal.set(pageSize);
    this.entityListPaginationStore.setPageSize(this.viewIdSignal(), pageSize);
}
```

### 5. Update `view.page.html`

File: `webapp/src/app/pages/view/view.page.html`

Change the `(nzPageSizeChange)` binding from a direct signal set to the new handler:

```html
(nzPageSizeChange)="onPageSizeChange($event)"
```

---

## Files to Edit

| File | Change |
|------|--------|
| `webapp/src/app/store/entity-list-pagination.store.ts` | Add `pageSizeByKeySignal`, `getPageSize`, `setPageSize` |
| `webapp/src/app/pages/entity-list/entity-list.page.ts` | Restore `pageSizeSignal` from store on route param change; add `onPageSizeChange` handler |
| `webapp/src/app/pages/entity-list/entity-list.page.html` | Wire `(nzPageSizeChange)` to `onPageSizeChange` |
| `webapp/src/app/pages/view/view.page.ts` | Restore `pageSizeSignal` from store on route param change; add `onPageSizeChange` handler |
| `webapp/src/app/pages/view/view.page.html` | Wire `(nzPageSizeChange)` to `onPageSizeChange` |

---

## Notes

- Page size state is in-memory only (same as page index), consistent with the existing store design.
- The key used for both pages is already defined: entity key for `entity-list` and view ID for `view`.
- `getPageSize` defaults to `10` (matching the original hardcoded default) so existing behavior is unchanged for first visits.
