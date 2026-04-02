# Global Create Button in Side Nav with Modal Workflows

## Overview
Add a "Create" button to the app-level side nav that opens a workflow allowing users to create records from anywhere in the app without leaving their current context. The workflow uses a two-step modal approach: first modal selects the entity type, second modal displays the creation form.

## Architecture

### New State Management
Create a new app-level service to manage global create workflow state and navigation:
- **GlobalCreateService** (`services/global-create.service.ts`)
  - Manages modal visibility and selected entity during the global create workflow
  - Handles pre-population of form data if needed
  - Delegates actual record creation to existing `EntityRecordService`

Create a new store for global workflow state:
- **GlobalCreateStore** (`store/global-create.store.ts`)
  - `isCreateModalOpen$`: WritableSignal<boolean> - visible state for entity selection modal
  - `isFormModalOpen$`: WritableSignal<boolean> - visible state for form modal
  - `selectedEntityId$`: WritableSignal<string | null> - currently selected entity for form step
  - Methods:
    - `openEntitySelectModal()` - set both modals closed, entity selection modal open
    - `selectEntity(entityId)` - update selectedEntityId, close entity modal, open form modal
    - `closeCreateFlow()` - close all modals, reset state
    - `getSelectedEntity()` - computed signal returning entity object

### Side Nav Button (Update App Component)
**File**: `/Users/bensivo/code/pdms/webapp/src/app/app.ts` (component) and `/Users/bensivo/code/pdms/webapp/src/app/app.html` (template)

1. **Component Updates**:
   - Inject `GlobalCreateStore` into App component
   - Expose store signals as public getters or directly in template
   - Add method `onClickCreateButton()` → calls `globalCreateStore.openEntitySelectModal()`

2. **Template Updates**:
   - Add "+ Create" button to side nav (after logo or before Home link)
   - Import `NzButtonModule` if not already present
   - Bind click handler to `onClickCreateButton()`
   - Style button for side nav (dark theme, appropriate sizing)

### Entity Selection Modal Component
**File**: `components/global-create/entity-select-modal.component.ts` (new)

Create a reusable modal component for selecting entity type:
- **Inputs**:
  - `isOpen$`: Signal<boolean>
  - `entities`: Entity[] list to display
  - `selectedEntityId$`: Signal<string | null>
- **Outputs/Events**:
  - `onSelectEntity(entityId)`: emits when user selects an entity
  - `onCancel()`: emits when user closes modal
- **Template**:
  - nz-modal with `[nzVisible]` bound to `isOpen$`
  - nz-select or list of radio buttons for entity selection
  - OK/Cancel buttons
  - Display entity name, handle selection change
- **Styling**: Follow card/modal patterns from existing code

### Form Modal Component
**File**: `components/global-create/form-modal.component.ts` (new)

Create a modal wrapper around the existing entity creation form:
- **Inputs**:
  - `isOpen$`: Signal<boolean>
  - `entity$`: Computed signal returning selected Entity
  - `formData`: Signal<Record<string, string>> - shared form state
- **Methods**:
  - `onClickSubmit()` - calls `EntityRecordService.createRecord()`, closes modal, navigates to detail page
  - `onClickCancel()` - resets form state, closes modals
- **Template**:
  - nz-modal with `[nzVisible]` bound to `isOpen$`
  - Embed/reuse form rendering logic from `entity-create.page.html` (can extract to shared template)
  - Form fields rendered conditionally by field type (short-text, long-text, number, reference, reference-list, option)
  - Submit/Cancel buttons
- **Logic**:
  - Initialize formData signal on entity selection
  - Implement same form state management as EntityCreatePageComponent (`getFieldValue()`, `setFieldValue()`, etc.)
  - Auto-focus first input on modal open (use `nzAfterOpen` event)

### Integration into App Component
**File**: `app.html` and `app.ts`

Update the App component to:
1. Inject `GlobalCreateStore`, `EntityService`, `EntityRecordService`
2. Add computed signal for selected entity
3. Render both modals below the main layout:
   - `<app-global-create-entity-select>`
   - `<app-global-create-form>`
4. Wire up event handlers from modals to `GlobalCreateStore` methods

### Navigation After Creation
After successful record creation:
1. Close modals via `GlobalCreateStore.closeCreateFlow()`
2. Navigate to `/entity/:key/:id` (detail page) as existing entity-create does
3. Use `Router.navigate()` with proper entity key generation

## Data Flow

1. User clicks "+ Create" button in side nav
2. `App.onClickCreateButton()` → `GlobalCreateStore.openEntitySelectModal()`
3. Entity selection modal renders with list of all entities
4. User selects entity → `GlobalCreateStore.selectEntity(entityId)`
5. Entity selection modal closes, form modal opens
6. Form modal renders creation form for selected entity
7. User fills form and clicks Submit
8. `FormModalComponent.onClickSubmit()`:
   - Calls `EntityRecordService.createRecord(entityId, formData)`
   - New record added to `EntityRecordStore.recordsSignal`
   - `GlobalCreateStore.closeCreateFlow()` closes all modals
   - `Router.navigate(['/entity', entityKey, recordId])` navigates to detail page
9. User returns to wherever they were before if they cancel at any step

## State Management Details

### GlobalCreateStore Implementation
```ts
export class GlobalCreateStore {
    isCreateModalOpen$ = signal<boolean>(false);
    isFormModalOpen$ = signal<boolean>(false);
    selectedEntityId$ = signal<string | null>(null);
    formData$ = signal<Record<string, string>>({});

    selectedEntity$ = computed(() => {
        const entityId = this.selectedEntityId$();
        if (!entityId) return null;
        return this.entityService.entities$().find(e => e.id === entityId) || null;
    });

    openEntitySelectModal(): void {
        this.isCreateModalOpen$.set(true);
        this.isFormModalOpen$.set(false);
        this.selectedEntityId$.set(null);
        this.formData$.set({});
    }

    selectEntity(entityId: string): void {
        this.selectedEntityId$.set(entityId);
        this.isCreateModalOpen$.set(false);
        this.isFormModalOpen$.set(true);

        // Initialize form data for selected entity
        const entity = this.entityService.entities$().find(e => e.id === entityId);
        if (entity) {
            const initialData: Record<string, string> = {};
            entity.fields.forEach(f => {
                initialData[f.id] = '';
            });
            this.formData$.set(initialData);
        }
    }

    closeCreateFlow(): void {
        this.isCreateModalOpen$.set(false);
        this.isFormModalOpen$.set(false);
        this.selectedEntityId$.set(null);
        this.formData$.set({});
    }
}
```

### Form State Management
- Reuse same pattern from `EntityCreatePageComponent`:
  - `getFieldValue(fieldId)` / `setFieldValue(fieldId, value)` methods
  - `getRefListValues(fieldId)` / `setRefListValues(fieldId, values)` for reference-list
  - `getReferenceOptions(field)` delegate to service

## Implementation Steps

1. **Create GlobalCreateStore** (`store/global-create.store.ts`)
   - Define state signals and computed selectors
   - Implement methods for modal workflow management

2. **Create GlobalCreateService** (optional, can use store directly)
   - Handle side effects like record creation completion

3. **Create Entity Selection Modal Component** (`components/global-create/entity-select-modal.component.ts`)
   - Render entity list/radio buttons
   - Emit selection event

4. **Create Form Modal Component** (`components/global-create/form-modal.component.ts`)
   - Render form fields based on entity
   - Handle submission and cancellation
   - Integrate with EntityRecordService for record creation

5. **Update App Component** (`app.ts` and `app.html`)
   - Inject new store and services
   - Add "+ Create" button to side nav
   - Render both modal components
   - Wire up event handlers

6. **Styling** (`app.less`)
   - Style the "+ Create" button in side nav context
   - Ensure modals follow design system (colors, spacing, typography)

## Testing Considerations

- Create button accessible from any route
- Entity selection modal displays all entities
- Form modal displays correct form fields for selected entity
- Form submission creates record and navigates to detail page
- Cancel at any step closes modals and returns to previous context
- Form data resets between creates
- Backlinks and reference fields work same as in entity-create page

## Dependencies
- Angular Signals (already in use)
- NG-Zorro components: Modal, Select/Radio, Input, Form, Button
- Existing: `EntityService`, `EntityRecordService`, `Router`, `generateEntityKey`

## Files to Create/Modify

### New Files
- `/Users/bensivo/code/pdms/webapp/src/app/store/global-create.store.ts`
- `/Users/bensivo/code/pdms/webapp/src/app/components/global-create/entity-select-modal.component.ts`
- `/Users/bensivo/code/pdms/webapp/src/app/components/global-create/entity-select-modal.component.html`
- `/Users/bensivo/code/pdms/webapp/src/app/components/global-create/entity-select-modal.component.less`
- `/Users/bensivo/code/pdms/webapp/src/app/components/global-create/form-modal.component.ts`
- `/Users/bensivo/code/pdms/webapp/src/app/components/global-create/form-modal.component.html`
- `/Users/bensivo/code/pdms/webapp/src/app/components/global-create/form-modal.component.less`

### Modified Files
- `/Users/bensivo/code/pdms/webapp/src/app/app.ts` (add button, wire up modals)
- `/Users/bensivo/code/pdms/webapp/src/app/app.html` (add button and modals to template)
- `/Users/bensivo/code/pdms/webapp/src/app/app.less` (style new button)

## Notes
- Follow existing TypeScript style guide (4-space indentation, camelCase, JSDoc comments)
- Follow existing LESS style guide (BEM-adjacent naming, spacing scale, design system colors)
- Reuse form field rendering logic from entity-create page (can extract to shared utils if needed)
- Use ModalState utility is not needed here since we have two sequential modals, not independent ones
- Modal workflow is linear: entity selection → form → submit/cancel, not bidirectional switching
