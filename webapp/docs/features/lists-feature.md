# Lists Feature

## Description
The Lists feature enables users to create named, ordered collections of entity records. Each list maintains a sequence of item IDs and allows drag-and-drop reordering. Users can also customize which columns (fields) are displayed inline with each item, supporting visibility of multiple entity types within a single list.

## Trigger
Navigation to route `/lists/:id` loads `ListsPageComponent`, which accepts a list ID as route parameter.

## Data Flow

1. **Route Entry**: `ActivatedRoute.params` subscription (ListsPageComponent:98) extracts list ID and stores in `listIdSignal`
2. **List Retrieval**: `listIdSignal` update triggers `list$` computed signal (line 25-28) → calls `ListsStore.getListById(listId)` → returns List object with id, name, itemIds[]
3. **Item Fetching**: `list$` change triggers `items$` computed signal (line 30-33) → maps itemIds to EntityRecords via `EntityRecordStore.getById(id)` for each item
4. **Entity Metadata**: `items$` change triggers `entityIds$` computed (line 36-40) → extracts unique entityId values from items
5. **Entity Definitions**: `entityIds$` change triggers `entities$` computed (line 43-46) → resolves Entity objects via `EntityStore.getById(id)` for each entityId
6. **Display Fields**: `entities$` change triggers `displayNameFields$` computed (line 49-64) → maps each entity's displayNameFieldId to EntityField object
7. **Available Fields**: `entities$` change triggers `availableFields$` computed (line 67-84) → collects all fields from all entities, excluding display name fields
8. **Column Modal Init**: `ngOnInit` (line 101-106) initializes `columnModalState` with default first 2 available fields via `columnModalState.committed$.set()`

### Render Path
- Template renders list name via `list$()` (lists.page.html:4)
- Template renders items via `items$()` (line 12)
- `app-sortable-list` component receives items array and itemTemplate
- `SortableListComponent.onSort()` (sortable-list.component.ts:38-55) emits reordered items → triggers `ListsPageComponent.onItemsChanged()`
- `onItemsChanged()` (ListsPageComponent:115-118) calls `ListsStore.setListItemIds()` to persist new order
- Per-item display: `EntityReferenceComponent` shows display name (entity-reference.component.ts:53-61)
- Column values: `getFieldValue()` (ListsPageComponent:190-192) retrieves `record.data[fieldId]`

### Column Selection Path
- User clicks "Columns" button → `onClickColumnsButton()` (line 123-125) → `columnModalState.open()` opens modal and syncs pending to committed
- Template renders checkboxes for `availableFields$()` (lists.page.html:40)
- `isPendingFieldSelected()` (ListsPageComponent:147-149) checks if fieldId in `columnModalState.pending$()`
- `onTogglePendingColumn()` (line 156-160) toggles fieldId in pending state
- User confirms → `onConfirmColumns()` (line 130-132) → `columnModalState.confirm()` copies pending to committed and closes modal
- User cancels → `onCancelColumns()` (line 137-139) → `columnModalState.cancel()` discards pending and closes modal
- Template shows selected columns via `columnModalState.committed$()` (lists.page.html:23-27)

## State Changes

1. **Route Init**: `listIdSignal` set from route params
2. **List Load**: `ListsStore.listsSignal` contains List object (must be pre-populated elsewhere)
3. **Item Records**: `EntityRecordStore.recordsSignal` contains all EntityRecord objects (must be pre-populated)
4. **Entity Schemas**: `EntityStore.entitiesSignal` contains all Entity definitions (must be pre-populated)
5. **Column Modal Open**: `columnModalState.isOpen$` set to true, `pending$` synced from `committed$`
6. **Column Selection**: `columnModalState.pending$` updated as user toggles checkboxes
7. **Column Confirm**: `columnModalState.committed$` set from `pending$`, `isOpen$` set to false
8. **Item Reorder**: `ListsStore.listsSignal` updated via `setListItemIds()` with new itemIds array

## External Integrations

None. All data is in-memory via Signal-based stores. No backend calls or external services involved.

## Important Notes

- **Pre-populated Stores**: ListsStore, EntityRecordStore, and EntityStore must be populated by external code before navigation to lists route. This feature assumes data already exists in stores.
- **Computed Dependency Chain**: Heavy reliance on computed signals that auto-subscribe to dependencies. Changes to EntityStore/EntityRecordStore automatically cascade through all computed signals.
- **Multi-Entity Lists**: A single list can contain records from different entities. Display name and field lookup is per-entity via entity.displayNameFieldId.
- **SortableJS Integration**: Uses SortableJS library with MultiDrag plugin (sortable.directive.ts:11) for drag-and-drop. Supports multi-select drag operations.
- **Modal State Pattern**: ModalState utility manages pending/committed separation for column selection. Pending state discarded on cancel; confirmed on OK.
- **No Persistence**: Column selection state (columnModalState.committed$) is not persisted—resets on page reload. List item order is persisted to ListsStore but not to backend.
- **Default Columns**: On init, automatically selects first 2 available fields if modal never opened (line 102-105).
