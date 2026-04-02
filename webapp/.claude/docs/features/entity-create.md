# Entity Create Feature

## Description
Allows users to create a new record instance for a specified entity type. Renders a form with input fields matching the entity's configurable fields, excluding read-only backlink fields. Supports all field types: short-text, long-text, number, reference (single), reference-list (multi), and option dropdowns.

## Trigger
Navigating to route `/entity-create/:key` where `:key` is the entity's URL-friendly slug (generated via `generateEntityKey()`). Typically triggered by a "+ New" button on the entity list page.

## Data Flow

1. **EntityCreatePageComponent** (`entity-create.page.ts`) initializes on route navigation
   - Reads `:key` param from `ActivatedRoute`
   - Looks up entity via `EntityService.entities$()` using `generateEntityKey()` for key matching
   - Validates entity exists; redirects to home if not
   - Initializes `formData` signal with empty string for each editable field

2. **Template** (`entity-create.page.html`) renders form
   - Filters fields via `editableFields$()` computed signal (excludes backlink type)
   - Renders conditional inputs based on field type:
     - Short-text/number: `<input>` with type binding
     - Long-text: `<textarea>` with autosize
     - Reference: `<nz-select>` single-select via `getReferenceOptions(field)`
     - Reference-list: `<nz-select nzMode="multiple">` multi-select via `getReferenceOptions(field)`
     - Option: `<nz-select>` with predefined `field.optionValues`
   - Binds form state via ngModel two-way binding to component methods

3. **Component methods** manage form state
   - `getFieldValue(fieldId)` / `setFieldValue(fieldId, value)` for text/number/reference/option fields
   - `getRefListValues(fieldId)` / `setRefListValues(fieldId, values)` for reference-list fields (converts to/from CSV format)

4. **getReferenceOptions(field)** delegates to `EntityRecordService`
   - Calls `EntityRecordService.getReferenceOptions(field)`
   - Returns list of `{ recordName, recordId }` tuples for the referenced entity
   - `recordName` is fetched via `EntityRecordService.getRecordDisplayName()` using entity's `displayNameFieldId` or first field as fallback

5. **Submit action** (`onClickSubmit()`)
   - Calls `EntityRecordService.createRecord(entity.id, this.formData())`
   - Service creates new `EntityRecord` with generated ID, entityId, and field data
   - Service calls `EntityRecordStore.add(record)` to append to signal
   - Returns newly created record
   - Router navigates to `/entity/:key/:id` (entity detail view) for the created record

## State Changes

- **formData signal**: Mutated via `update()` on each field change to hold current form values
- **EntityRecordStore.recordsSignal**: Appended with new record via `add()` method
- **Router navigation**: Two transitions occur:
  1. Initial: `/entity-create/:key` (this page)
  2. Post-submit: `/entity/:key/:id` (detail page for newly created record)

## External Integrations

None. All data is stored in-memory via Angular Signals. No backend API calls or database transactions. Data persists only in the current session.

## Important Notes

- **Reference-list CSV format**: Multiple selected records are stored as comma-separated IDs. The component caches the array conversion to avoid redundant splits on every change detection cycle (see `refListValueCache` / `refListValueCacheArray`).
- **First input focus**: `ngAfterViewInit()` auto-focuses the first input field for UX.
- **Back navigation**: Back button and Cancel button both navigate to `/entity/:key` (list view) via `onClickBackButton()`.
- **Backlink fields excluded**: Backlink fields are read-only and auto-calculated, so they're filtered out before form rendering.
- **Display name fallback**: If an entity hasn't configured a `displayNameFieldId`, the record ID is used as the display label in reference dropdowns.
- **ID generation**: Records are assigned IDs via `EntityRecordService.generateId()` using timestamp + random string (no collision guarantee in distributed systems, but sufficient for in-memory session state).
