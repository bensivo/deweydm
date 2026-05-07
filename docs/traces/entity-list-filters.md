# Entity List Filters

## Overview
The entity list page supports dynamic, multi-condition filtering of records by field, operator, and value. Filters are managed by a singleton `FilterService` which holds an in-memory signal of `Filter` objects scoped to the currently-viewed entity, and are applied client-side in a `computed` signal that re-derives the visible record set whenever filters or records change. Operators available depend on the field type (text, number, reference, reference-list, option, backlink) and filter state can be persisted as a saved View.

## Flow

1. User navigates to `/entity/:key`. The entity list page resolves the entity by key, tells `FilterService` which entity is currently active, and clears any leftover filters from previous pages.
2. User clicks the "Filters" toolbar button which toggles a filters panel below the toolbar.
3. User clicks "+ Add Filter". The page calls `FilterService.addFilter()` which appends a new `Filter` object (default field, default operator for that field type, empty value) to the filters signal.
4. The filter row UI renders three controls: a field select, an operator select (options are derived from the chosen field's type), and a type-appropriate value input (text input, number input, reference dropdown, option dropdown — or no input for `is-empty`/`is-not-empty`).
5. As the user changes field, operator, or value, the page calls `FilterService.updateFilter()` (changing the field also resets operator and value to defaults for the new field type).
6. The list's `filteredAndSortedRecords$` computed signal re-runs, calling `FilterService.applyFiltersToRecords()`. Incomplete filters (empty value, invalid number) are skipped; remaining filters are AND-ed together via per-field-type comparison logic.
7. User can remove a filter row, or click "Save as View" to persist the current filter set (handled by `ViewService`).

## Trace

### 1. Page init: bind entity to FilterService and clear stale filters
- `webapp/src/app/pages/entity-list/entity-list.page.ts:142` `ngOnInit()` reads the route `:key` param, finds the matching entity, then calls `filterService.setCurrentEntity(entity.id)` and removes any pre-existing filters.
- `webapp/src/app/services/filter.service.ts:38` `setCurrentEntity()` writes the entity id to `currentEntityIdSignal`, which scopes `getFilters()` / `getFiltersSignal()` to that entity.

### 2. Toggling the filters panel
- `webapp/src/app/pages/entity-list/entity-list.page.ts:349` `onClickFilterToggleButton()` flips `isFiltersVisibleSignal`.
- `webapp/src/app/pages/entity-list/entity-list.page.html:52` `*ngIf="isFiltersVisibleSignal()"` shows/hides the `filters-section`.

### 3. Adding a filter row
- `webapp/src/app/pages/entity-list/entity-list.page.ts:356` `onClickAddFilterButton()` calls `filterService.addFilter(entity.fields)`.
- `webapp/src/app/services/filter.service.ts:69` `addFilter()` builds a new `Filter` (defaults field to first entity field, picks the first valid operator from `filterOperatorsMapSignal`), increments `nextFilterIdSignal`, and appends to `filtersSignal`.
- `webapp/src/app/models/filter.model.ts:9` defines the `Filter` shape (`id`, `entityId`, `fieldId`, `operator`, `value: string | string[]`).

### 4. Rendering filter rows reactively
- `webapp/src/app/pages/entity-list/entity-list.page.html:54` `*ngFor="let filter of getFiltersSignal()()"` iterates the entity-scoped filters signal.
- `webapp/src/app/services/filter.service.ts:57` `getFiltersSignal()` returns a `computed` that filters `filtersSignal()` by `currentEntityIdSignal`.
- The template renders a field `<nz-select>`, an operator `<nz-select>` (options from `filterService.getFilterOperatorsForFieldType(...)`), and a value control switched by field type (`isTextFieldType`, `number`, `isReferenceFieldType`, `option`) — see `entity-list.page.html:56-127`.

### 5. Updating a filter (field / operator / value change)
- `webapp/src/app/pages/entity-list/entity-list.page.ts:379` `onFilterFieldChange()` resets operator+value to defaults for the new field type via `filterService.updateFilter()`.
- `webapp/src/app/pages/entity-list/entity-list.page.ts:401` `onFilterOperatorChange()` and `:411` `onFilterValueChange()` patch only the changed property.
- `webapp/src/app/services/filter.service.ts:101` `updateFilter()` does an immutable `map` update on `filtersSignal`.

### 6. Operators allowed per field type
- `webapp/src/app/services/filter.service.ts:21` `filterOperatorsMapSignal` maps each `FieldType` (`short-text`, `long-text`, `number`, `reference`, `reference-list`, `option`, `backlink`) to the operators it supports.
- `webapp/src/app/services/filter.service.ts:132` `getFilterOperatorsForFieldType()` is the lookup used by both the page and template.

### 7. Applying filters to the visible record set
- `webapp/src/app/pages/entity-list/entity-list.page.ts:87` `filteredAndSortedRecords$` computed signal pulls `records$()`, the active filters via `filterService.getFilters()`, and calls `filterService.applyFiltersToRecords(records, filters, entity, entityRecordService)` before the text-search and sort steps.
- `webapp/src/app/services/filter.service.ts:145` `applyFiltersToRecords()` first drops incomplete filters (empty string / invalid number, except `is-empty`/`is-not-empty`), then `records.filter(... activeFilters.every(...))` AND-combines them.
- `webapp/src/app/services/filter.service.ts:187` `applyFilter()` switches on `field.type` and `filter.operator` to evaluate a single (record, filter) pair. Backlink filters call `entityRecordService.getBacklinkedRecords(...)` and check `length`.

### 8. Removing a filter
- `webapp/src/app/pages/entity-list/entity-list.page.ts:368` `onClickRemoveFilterButton()` calls `filterService.removeFilter(filterId)`.
- `webapp/src/app/services/filter.service.ts:91` `removeFilter()` filters the signal by id.

### 9. Saving the current filter set as a View
- `webapp/src/app/pages/entity-list/entity-list.page.ts:506` `onConfirmSaveView()` reads `filterService.getFilters()` and passes them to `viewService.saveView(entity.id, viewName, currentFilters)`.
- `FilterService.addFilterWithData()` (`filter.service.ts:113`) is the inverse used when restoring a saved View — it copies a saved filter's field/operator/value under a fresh id scoped to the current entity.
