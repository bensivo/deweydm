# Save-As-View Feature Plan

## Overview
Add a "Save as View" button to the entity-list page that persists the currently-applied filters as a saved view. A saved view functions as a pre-filtered variant of the entity-list page, accessible from the sidebar navigation with all active filters pre-applied automatically.

## Terminology
- **View**: A saved set of filters tied to a specific entity and accessible from the sidebar. Similar to saved searches in other apps.
- **Filter**: Individual field-operator-value conditions applied in the entity-list page (managed by FilterService).

## Data Model

Create a new interface `View` in `src/app/models/view.model.ts`:

```typescript
export interface View {
    id: string;
    name: string;
    entityId: string;
    filters: Filter[];  // Array of Filter objects from filter.model.ts
}
```

## Architecture

### 1. Store Layer: ViewStore (`src/app/store/view.store.ts`)

Create a new Signal-based store following the pattern of `ListsStore` and `EntityStore`:

- `viewsSignal`: Signal<View[]> - holds all saved views
- `views$`: readonly signal (asReadonly)
- Methods:
  - `getViewsByEntityId(entityId: string): View[]` - get all views for an entity
  - `getViewById(viewId: string): View | undefined`
  - `createView(id: string, name: string, entityId: string, filters: Filter[]): void`
  - `updateView(viewId: string, updates: Partial<View>): void`
  - `deleteView(viewId: string): void`
  - `getAll(): View[]`

### 2. Service Layer: ViewService (`src/app/services/view.service.ts`)

Handle business logic for view operations:

- `views$`: computed signal returning `viewStore.views$`
- `getViewsByEntityId(entityId: string): View[]` - delegates to store
- `saveView(entityId: string, viewName: string, filters: Filter[]): View`
  - Generate unique ID (e.g., `view-${timestamp}-${uuid}`)
  - Create View object
  - Call `viewStore.createView()`
  - Return the created View

### 3. Component: Save-As-View Modal

Add a modal component `src/app/components/save-view-modal/save-view-modal.component.ts`:

- Input: `@Input() isOpen: boolean` - modal visibility
- Input: `@Input() entityId: string` - entity being filtered
- Output: `@Output() onSave = new EventEmitter<string>()` - emits view name
- Output: `@Output() onCancel = new EventEmitter<void>()`
- Property: `viewNameSignal: signal<string>('')` - form input for view name
- Methods:
  - `onSaveClick()`: emit onSave event if name is non-empty, close modal
  - `onCancelClick()`: emit onCancel event, close modal

Use ng-zorro Modal component with form input.

### 4. Integration: EntityListPageComponent Updates

Update `src/app/pages/entity-list/entity-list.page.ts`:

- Add ViewService injection
- Add property: `isViewSaveModalOpenSignal = signal<boolean>(false)`
- Add method: `onClickSaveAsView()` - open save modal
- Add method: `onConfirmSaveView(viewName: string)`
  - Get current filters from FilterService
  - Call ViewService.saveView(entity.id, viewName, filters)
  - Close modal
  - Show success toast (optional, using ng-zorro notification)
- Add method: `onCancelSaveView()` - close modal
- Update template: Add "Save as View" button in the filter toolbar (near filter-related UI)

### 5. Integration: App Component & Navigation

Update `src/app/app.ts`:

- Add ViewService injection
- Add property: `views$` - computed signal returning filtered views for current entity
- Update template in `src/app/app.html`:
  - After the entity list in sidebar, add a new section for "Views" (similar to existing entity list)
  - For each view: create menu item with routerLink to `/view/:viewId`

### 6. New Route: ViewPageComponent

Create `src/app/pages/view/view.page.ts`:

This is the key component—it renders the entity-list page with pre-applied view filters.

- Route: `/view/:viewId`
- Implementation:
  - Inject ViewService and FilterService
  - On init: 
    - Fetch view by ID from ViewService
    - Extract entityId and filters from view
    - Set current entity in FilterService via `setCurrentEntity(entityId)`
    - For each filter in view, call FilterService.addFilter() with the pre-saved values
  - Template: Reuse entity-list HTML/logic OR compose entity-list as a child component
  
**Option A (Recommended)**: Extract EntityListPageComponent logic into a reusable inner component, then both entity-list and view-list use it.

**Option B (Simpler)**: Copy entity-list template/styles into view-list and add initialization logic.

### 7. Route Configuration Updates

Update `src/app/app.routes.ts`:

- Add: `{ path: 'view/:viewId', component: ViewPageComponent }`

### 8. UI/UX Considerations

**Save-As-View Button Placement**:
- Add to entity-list filter toolbar (near existing filter controls)
- Button text: "Save as View" or "Save View"
- Icon: Use ng-zorro BookmarkOutlined or SaveOutlined

**Sidebar Navigation**:
- Each view shows as a link 

**Validation**:
- Prevent saving views with empty names
- Prevent saving views with no filters, button shoudl be disabled if no filters exist
- Show confirmation before deleting views

## Filter Persistence Strategy

### Initial Save
When user clicks "Save as View", capture the current Filter[] array:
- Get filters via `FilterService.getFilters()`
- Clone the Filter objects (deep copy) and store in View.filters

### On View Navigation
When user navigates to a saved view:
- Extract View.filters array
- For each Filter in the array, manually reconstruct FilterService state:
  ```typescript
  this.filterService.setCurrentEntity(view.entityId);
  view.filters.forEach(filter => {
      this.filterService.addFilter(entity.fields); // Create empty filter
      this.filterService.updateFilter(filterId, filter); // Populate with saved values
  });
  ```

## State Flow Diagram

```
EntityListPage
  ├─ User clicks "Save as View"
  │  └─ Modal opens (SaveViewModalComponent)
  │     └─ User enters name, clicks Save
  │        └─ EntityListPage.onConfirmSaveView()
  │           ├─ Get current filters from FilterService
  │           └─ Call ViewService.saveView()
  │              └─ ViewStore.createView()
  │                 └─ Signal updated, UI re-renders
  │                    └─ AppComponent sees new view in views$
  │                       └─ Sidebar updates with new nav link
  │
  └─ User clicks view link in sidebar
     └─ Navigate to /view/:viewId
        └─ ViewPage init
           ├─ Fetch view from ViewService
           └─ Populate FilterService with saved filters
              └─ Display filtered entity list
```

## Implementation Sequence

1. Create View model (`view.model.ts`)
2. Create ViewStore (`view.store.ts`)
3. Create ViewService (`view.service.ts`)
4. Create SaveViewModalComponent
5. Create ViewPageComponent (reuse entity-list logic)
6. Update EntityListPageComponent with "Save as View" button and modal integration
7. Update AppComponent to show views in sidebar
8. Update app.routes.ts with new route
9. Update app.html navigation to include view links
10. Test end-to-end flow

## Key Considerations

- **Filter Serialization**: Filters are already serializable (all primitives/arrays). No special serialization needed.
- **View ID Generation**: Use `generateEntityKey()` pattern or UUID. Simple `view-${Date.now()}-${Math.random()}` is acceptable.
- **Persistence**: Current implementation stores views in memory (signals). Future backend integration would serialize views to database.
- **Naming Conflicts**: Allow duplicate view names for now (similar to how lists work).
- **Filter Editing**: Saved views are read-only snapshots. To modify, delete and recreate. (Future: add edit capability)
- **Reference Field Filters**: If a filter references another record by ID and that record is deleted, the filter value becomes invalid. Handle gracefully in FilterService.applyFilter() (already does via .find()).
- **No Breaking Changes**: This feature is purely additive. Does not modify existing FilterService, EntityListPageComponent (minimally), or navigation structure.

## Testing Scenarios

1. Save view with no filters applied (edge case: what should happen?)
2. Save view with multiple filters on various field types
3. Navigate to saved view and verify filters are applied
4. Delete a view from sidebar
5. Save two views for the same entity with different filters
6. Switch between entity lists and views in sidebar
7. Check that unsaved filters on one entity don't bleed into another entity's view

## Future Enhancements

- Edit saved views (update filters)
- Duplicate views
- Reorder views via drag-and-drop
- Set a view as the "default" view for an entity (auto-load on navigation)
- Share views with other users (requires backend)
- View usage analytics
- Archive/hide views
