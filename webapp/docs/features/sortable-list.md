# Sortable List Feature

## Description
Drag-and-drop reordering of list items with multi-select support. Users can drag individual items or multiple selected items to new positions within a list. Single or multiple items can be moved in one operation.

## Trigger
Invoked in **ListsPageComponent** via `<app-sortable-list>` component. Activated when user drags items using the grab handle (⋮ icon).

## Data Flow

1. **ListsPageComponent** (`lists.page.ts:11-15`)
   - Passes items array and custom item template to `SortableListComponent`
   - Listens to `(onItemsChanged)` output event

2. **SortableListComponent** (`sortable-list.component.ts`)
   - Renders items with `SortableDirective` applied to container
   - Template (`sortable-list.component.html:2-4`) binds `(sortableSort)="onSort($event)"`
   - `onSort()` method (`sortable-list.component.ts:38-55`):
     - Receives `SortableEvent` with `oldIndices[]` and `newIndex`
     - Reorders array by removing items from old positions, inserting at new position
     - Emits reordered array via `onItemsChanged.emit()`

3. **SortableDirective** (`sortable.directive.ts:22-61`)
   - Wraps SortableJS library with MultiDrag plugin
   - Initializes on `ngAfterViewInit` with config:
     - `handle: '.sortable-handle'` - drag only from handle
     - `multiDrag: true` - allow multiple item selection
     - `ghostClass: 'sortable-ghost'` - visual feedback
   - `onEnd` handler fires on drop:
     - Multi-item: emits `oldIndices[]` + `newIndex`
     - Single item: emits `oldIndices: [oldIndex]` + `newIndex`
   - Destroys instance on `ngOnDestroy`

4. **Back to ListsPageComponent** (`lists.page.ts:115-118`)
   - `onItemsChanged()` handler receives reordered items
   - Extracts IDs and calls `ListsStore.setListItemIds(listId, itemIds)`

5. **ListsStore** (`store/lists.store.ts:31-36`)
   - `setListItemIds()` updates list's `itemIds` property via signal mutation

## State Changes

- **ListsStore.listsSignal**: `List[].itemIds` is updated with new item order
- **Angular template change detection**: Triggers rerender of list with new order
- **No external persistence**: Changes are in-memory only (no API calls)

## External Integrations

- **SortableJS library**: Multi-select drag-and-drop implementation (mounted with MultiDrag plugin)
- No database, API, or message broker integrations

## Important Notes

- Items are identified by ID when reordering; actual item objects are not moved
- Multi-item drag respects original item order when inserting at destination
- Removal happens in reverse index order to avoid index shifting during splice operations
- Empty state message shown when `items().length === 0`
- Handle element has cursor feedback: `grab` on hover, `grabbing` while dragging
- Component is generic (`<T>`) and reusable; currently only used by ListsPageComponent
