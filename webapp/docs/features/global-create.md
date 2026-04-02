# Global Create Feature

## Description
Two-modal workflow allowing users to create new entity records from anywhere in the application. User selects an entity type in the first modal, then fills in field values in a second modal before submitting.

## Trigger
User clicks "+ Create" button in left sidebar of `app.ts` template, invoking `onClickCreateButton()`.

## Data Flow

1. **Entry**: `app.ts` `onClickCreateButton()` calls `globalCreateStore.openEntitySelectModal()`

2. **Modal 1 - Entity Selection**:
   - `global-create.store.ts` `openEntitySelectModal()` sets `isCreateModalOpenSignal=true`, resets form state
   - `app.ts` passes entities list to `entity-select-modal.component.ts`
   - User clicks entity button, component emits to `onSelectEntity()` in `app.ts`
   - `app.ts` calls `globalCreateStore.selectEntity(entityId)`

3. **Transition**:
   - `global-create.store.ts` `selectEntity()`:
     - Closes entity modal (`isCreateModalOpenSignal=false`)
     - Opens form modal (`isFormModalOpenSignal=true`)
     - Initializes empty `formDataSignal` with all entity field IDs
     - Sets `selectedEntityIdSignal` to trigger `selectedEntity$` computed
   - `global-create.store.ts` `selectedEntity$` computed queries `entityService.entities$()` to resolve entity object

4. **Modal 2 - Form Entry**:
   - `form-modal.component.ts` receives entity, formData, and populates fields
   - Component filters out `backlink` type fields via `editableFields$` computed
   - For reference/reference-list fields, calls `entityRecordService.getReferenceOptions(field)`
     - `entity-record.service.ts` looks up records of referenced entity, gets display names via `getRecordDisplayName()`
   - User edits fields, component updates local `localFormDataSignal` via `onFieldChange()` or `setRefListValues()`
   - User submits form, component emits to `onSubmit()` in `app.ts`

5. **Create & Close**:
   - `app.ts` calls `entityRecordService.createRecord(entityId, formData)`
   - `entity-record.service.ts` `createRecord()`:
     - Generates UUID via `generateId()`
     - Constructs `EntityRecord` object with `{ id, entityId, data }`
     - Calls `entityRecordStore.add(record)` to insert
   - `app.ts` calls `globalCreateStore.closeCreateFlow()` to reset all modal state

## State Changes

**GlobalCreateStore signals**:
- `isCreateModalOpenSignal`: `false` → `true` (step 1) → `false` (step 3) → `false` (step 5)
- `isFormModalOpenSignal`: `false` → `false` (step 1) → `true` (step 3) → `false` (step 5)
- `selectedEntityIdSignal`: `null` → `null` (step 1) → `entityId` (step 3) → `null` (step 5)
- `formDataSignal`: `{}` → `{}` (step 1) → `{fieldId: ''}` populated (step 3) → mutated by user input (step 4) → `{}` (step 5)

**EntityRecordStore signal**:
- `recordsSignal`: existing array → new `EntityRecord` appended (step 5)

## External Integrations
None. Feature is entirely in-memory using Angular Signals. No database, API, or external systems involved.

## Important Notes
- Form initialization in step 3 creates empty field values for all non-backlink fields
- Reference field values stored as comma-separated IDs (reference-list) or single ID (reference)
- Display names resolved at render-time, not stored with record
- FormModalComponent maintains separate local form state to allow cancellation without committing
- Entity list read-only from EntityStore via EntityService, GlobalCreateStore uses computed signal to lazily resolve selected entity object
