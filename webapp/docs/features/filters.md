# Filters Feature

## Description
Dynamic filtering system enabling users to create multiple filter conditions on entity record lists. Filters support 12 operators across 7 field types (text, number, reference, reference-list, option, backlink). Filters are entity-specific and can be saved as named views for reuse.

## Trigger
- Click "Filters" button in entity list toolbar to toggle filter visibility
- Click "+ Add Filter" or "+ Add Another Filter" to add a new filter row
- Click "Remove" (X) button to delete a filter
- Filters automatically apply as user configures field, operator, and value

## Data Flow

1. **Initialization** (entity-list.page.ts:142-157):
   - User navigates to entity list route
   - `setCurrentEntity(entityId)` called on FilterService to set scope
   - Entity fields loaded from EntityService

2. **Filter Management** (entity-list.page.ts:335-406):
   - User interaction calls component methods: `onClickAddFilterButton()`, `onFilterFieldChange()`, `onFilterOperatorChange()`, `onFilterValueChange()`, `onClickRemoveFilterButton()`
   - These methods delegate to FilterService: `addFilter()`, `updateFilter()`, `removeFilter()`

3. **Filter Service Operations** (filter.service.ts:32-135):
   - `setCurrentEntity()` sets `currentEntityIdSignal` to scope filters to active entity
   - `addFilter()` creates new Filter with unique id, default field/operator, empty value; stores in `filtersSignal`
   - `updateFilter()` performs partial updates on matching filter
   - `removeFilter()` deletes filter by id
   - `getFilters()` returns only filters matching `currentEntityIdSignal`
   - `getFiltersSignal()` returns computed signal for reactive binding in template
   - `getFilterOperatorsForFieldType()` returns valid operators from `filterOperatorsMapSignal`

4. **Filter Application** (entity-list.page.ts:87-130):
   - `filteredAndSortedRecords$` computed signal:
     - Calls `filterService.applyFiltersToRecords(records, filters, entity, entityRecordService)`
     - Returns filtered, text-searched, and sorted records
   - Results bound to table data in template

5. **Filter Evaluation** (filter.service.ts:145-301):
   - `applyFiltersToRecords()` validates active filters (non-empty values, except empty operators)
   - For each record, `applyFilter()` checks if record passes all filters using `every()`
   - Field-type-specific matching logic:
     - Text: contains, equals, not-equals, starts-with, ends-with (case-insensitive)
     - Number: equals, not-equals, comparison operators (numeric parsing)
     - Reference: equals, not-equals (direct id match)
     - Reference-list: contains, not-contains (comma-separated id list)
     - Option: equals, not-equals (predefined values)
     - Backlink: is-empty, is-not-empty (calls EntityRecordService.getBacklinkedRecords())

6. **Save as View** (entity-list.page.ts:490-507):
   - User clicks "Save as View" button
   - Modal opens via SaveViewModalComponent
   - `onConfirmSaveView()` calls `viewService.saveView(entityId, viewName, filters)`
   - ViewService creates View with deep-copied filters and stores via ViewStore

## State Changes

**FilterService:**
- `filtersSignal`: Updated when filters added, removed, or modified
- `nextFilterIdSignal`: Incremented when new filter created
- `currentEntityIdSignal`: Set when entity changes (scopes all operations)

**EntityListPageComponent:**
- `isFiltersVisibleSignal`: Toggles filter section visibility
- `filterTextSignal`: Updated on search input change
- `sortFieldIdSignal` / `sortOrderSignal`: Updated on column header click
- `isViewSaveModalOpenSignal`: Opened/closed by user actions

**ViewStore** (when saving as view):
- `viewsSignal`: New View added with copied filters

## External Integrations

**None.** All operations in-memory using Angular Signals. Filters persist only during session. No database or API calls. ViewStore integration is internal.

## Important Notes

- **Entity Scoping**: FilterService uses `currentEntityIdSignal` to scope filters. Must call `setCurrentEntity()` when navigating to different entities, otherwise filters apply incorrectly.
- **Filter Validation**: Empty operators (is-empty, is-not-empty) bypass value validation. Other operators require non-empty values. Number operators validate numeric values.
- **Case-Insensitive Text**: Text field operators use `toLowerCase()` comparison.
- **Reference List Filtering**: Reference-list fields store comma-separated IDs; contains/not-contains check membership.
- **Backlink Filtering**: Backlink operators query backlinking records via EntityRecordService; no value input needed.
- **Deep Copying**: Views save deep-copied filters to prevent mutations when user modifies current filters.
- **Filter Order**: AND logic only; all active filters must pass.
- **Template Binding**: Uses two-way `[(ngModel)]` on filter value inputs with manual `(blur)` and `(keydown.enter)` triggers to update state.
