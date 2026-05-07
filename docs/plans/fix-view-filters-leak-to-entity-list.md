# Fix: View filters leak into Entity List page

## Bug Description
When a user opens a View (which applies saved filters via `FilterService`), then navigates to the Entity List page for the same entity, the filters from the View are still applied to the Entity List page.

The Entity List page should always start with no filters applied — it is the "unfiltered" base view of an entity's records.

## Root Cause

The `FilterService` (`/Users/bensivo/code/pdms/webapp/src/app/services/filter.service.ts`) is a root-provided singleton that stores filters in a single `filtersSignal`, keyed by `entityId`. Filters persist across navigations.

- In `view.page.ts` `ngOnInit` (lines 163-174): the page calls `filterService.setCurrentEntity(view.entityId)`, removes any existing filters for that entity, and then adds each filter from the saved view via `addFilterWithData`.
- In `entity-list.page.ts` `ngOnInit` (lines 142-157): the page calls `filterService.setCurrentEntity(entity.id)` but does NOT clear existing filters for that entity.

Because both pages target the same `entityId`, filters previously added by the View page remain in the `FilterService` state and are picked up by the Entity List page's `filteredAndSortedRecords$` computed signal.

## Fix Strategy

When the Entity List page initializes for a given entity, it should clear all filters that exist for that entity in the `FilterService` before any rendering happens. This mirrors the existing pattern already used in `view.page.ts` (lines 165-169) so the behavior is consistent across pages.

We will not alter `FilterService`'s API or state model — the fix lives in `entity-list.page.ts`.

## Files to Edit

### 1. `/Users/bensivo/code/pdms/webapp/src/app/pages/entity-list/entity-list.page.ts`

In `ngOnInit`, after `this.filterService.setCurrentEntity(entity.id)`, clear all filters for that entity. This guarantees the Entity List always starts in an unfiltered state.

```typescript
ngOnInit(): void {
    this.route.params.subscribe(params => {
        const key = params['key'];
        this.entityKeySignal.set(key);
        if (!this.entity$()) {
            this.router.navigate(['/']);
        } else {
            const entity = this.entity$();
            if (entity) {
                const allFieldIds = new Set(entity.fields.map(f => f.id));
                this.columnModalState.committed$.set(allFieldIds);

                // Set the current entity in the filter service so filters are entity-specific
                this.filterService.setCurrentEntity(entity.id);

                // Clear any filters that may have been left over from a previous page
                // (e.g., a View page for the same entity). The entity list always starts unfiltered.
                const existingFilters = this.filterService.getFilters();
                existingFilters.forEach(filter => {
                    this.filterService.removeFilter(filter.id);
                });
            }
        }
    });

    // Track shift key state
    // ... existing code unchanged ...
}
```

## Files NOT Edited

- `filter.service.ts` — no API changes needed.
- `view.page.ts` — already clears filters correctly on its own init.

## Test Plan (manual)

1. Navigate to an entity list page, confirm there are no filters applied.
2. Add a filter, click "Save as View" and save the view.
3. Navigate to the saved View — confirm the filter is applied and visible.
4. Navigate back to the entity-list page for the same entity (via sidebar / home).
5. Confirm: no filters are applied, all records are shown, and the filters panel is empty.
6. Repeat with multiple filters in the view to confirm all are cleared.

## Considerations

- This clears filters every time the user enters the entity-list page. That matches the requested behavior ("entity list should not carry view filters"). If in the future we want the entity-list page to also remember in-session filters across navigations, this approach would need to be revisited — but per the bug report, the desired behavior is a clean start.
- The `route.params.subscribe` callback fires on every entity-list navigation (including changing `:key`), so the clear runs in all relevant cases.