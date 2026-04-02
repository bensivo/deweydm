# Entity List Feature

## Description
Displays paginated, filterable, and sortable table of entity records. Users can search by field values, customize visible columns, select multiple records, sort by any column, and bulk-add selected records to lists. Each record row is clickable to navigate to the detail view.

## Trigger
Navigate to `/entity/:key` where `:key` is the entity's kebab-case name. Route resolved by `entity-list.page.ts`.

## Data Flow

1. **Route Resolution** → `EntityListPageComponent.ngOnInit()`
   - `ActivatedRoute.params` provides entity key
   - Key passed to `EntityListPageComponent.entityKeySignal`

2. **Entity Lookup** → `EntityListPageComponent.entity$()` computed
   - Calls `EntityService.entities$()` → reads `EntityStore.entities$`
   - Matches entity by `generateEntityKey(entity.name)`
   - If entity not found, redirects to home

3. **Records Retrieval** → `EntityListPageComponent.records$()` computed
   - Filters records from `EntityRecordService.records$()` by `entityId`
   - Source: `EntityRecordStore.records$`

4. **Filtering & Sorting** → `EntityListPageComponent.filteredAndSortedRecords$()` computed
   - Applies text filter across all field values (case-insensitive substring match)
   - Applies sort by selected column (numeric or lexicographic)
   - Returns array passed to `nz-table` component

5. **Column Selection** → `EntityListPageComponent.columnModalState`
   - Initializes with all entity fields visible
   - User toggles visibility via `onTogglePendingColumn()`
   - Confirmed via `onConfirmColumns()` updates `visibleFields$`

6. **Record Display** → Template iteration over `filteredAndSortedRecords$()`
   - For `reference` fields: renders `EntityReferenceComponent` with recordId
   - For `reference-list` fields: calls `getRefListItems()`, renders multiple `EntityReferenceComponent`s
   - Other fields: calls `getFieldDisplayValue()` for formatted display

7. **Navigation to Detail** → `onClickRecordRow(recordId)`
   - Routes to `/entity/:key/:id` via `Router.navigate()`

8. **List Management** → `onAddSelectedItemsToList(listId)`
   - Gets selected record IDs from `selectedRecordIdsSignal`
   - Calls `ListService.addItemsToList(listId, recordIds)`
   - Updates `ListsStore.addItemIdsToList()`

## State Changes

**Component-Level Signals**:
- `entityKeySignal`: Set from route params
- `filterTextSignal`: Updated on search input
- `sortFieldIdSignal` / `sortOrderSignal`: Updated on column header click (cycles asc → desc → null)
- `selectedRecordIdsSignal`: Updated on checkbox toggle or range select
- `isShiftHeldSignal`: Tracks shift key for range selection
- `columnModalState.pending$`: Tracks field visibility in modal (uncommitted)
- `columnModalState.committed$`: Committed visible fields (live)

**Store-Level State**:
- `EntityStore.entitiesSignal`: Read-only (no writes from this component)
- `EntityRecordStore.recordsSignal`: Read-only (no writes from this component)
- `ListsStore.listsSignal`: Updated by `addItemIdsToList()` when adding records to lists

## External Integrations
None. All state is in-memory (Signals). No API calls or external systems.

## Important Notes

- **Reference Fields**: Delegate rendering to `EntityReferenceComponent`, which independently fetches display names via `EntityRecordService.getRecordDisplayName()`
- **Reference-List Fields**: CSV-formatted string (comma-separated IDs) split and mapped to multiple links
- **Display Names**: Pulled from `displayNameFieldId` or first field of referenced entity; falls back to record ID
- **Shift+Click**: Range selection between last selected and current clicked record (works only within filtered/sorted view)
- **Column Selection**: Uses `ModalState` utility for pending/committed pattern—changes only apply after confirm
- **Sorting**: Numeric-aware—detects if values are numbers and sorts numerically
- **No Persistence**: Column visibility and selections exist only in component memory; lost on navigation
