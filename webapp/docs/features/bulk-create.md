# Bulk Create Feature

## Description
Creates multiple entity records at once via a spreadsheet-like interface. Users select fields to display, fill in a table with multiple rows of data, then save all records together in a single operation.

## Trigger
- User clicks "Bulk Create" button on entity list page (`EntityListPageComponent.onClickBulkCreateButton()`)
- Navigates to `/entity-bulk-create/:key` route
- Component loads entity by key using `generateEntityKey()` matching

## Data Flow

1. **Route Navigation**: User navigates to `/entity-bulk-create/:key`
   - Route resolved to `EntityBulkCreatePageComponent` (app.routes.ts:17)

2. **Component Initialization**: `EntityBulkCreatePageComponent.ngOnInit()`
   - Reads entity key from route params
   - Resolves entity via `EntityService.entities$()` lookup
   - Initializes `fieldModalState` with display name field selected by default
   - Initializes `bulkDataSignal` with single empty row

3. **Field Selection Modal**: User clicks "Select Fields"
   - `onClickFieldsButton()` → `fieldModalState.open()`
   - Modal displays checkboxes for all non-backlink fields
   - `onTogglePendingField()` updates `fieldModalState.pending$()`
   - `onConfirmFields()` → `fieldModalState.confirm()` syncs pending to committed

4. **Table Rendering**: `visibleFields$` computed signal filters entity fields by committed field selection
   - Template iterates over `bulkDataSignal()` rows and `visibleFields$()`
   - Renders appropriate input based on field type:
     - `short-text` / `long-text`: text inputs
     - `number`: number inputs
     - `reference` / `option`: select dropdowns
     - `reference-list`: multi-select dropdowns via `nz-select nzMode="multiple"`

5. **Data Entry**: User fills cells
   - Text inputs call `setCellValue(rowIndex, fieldId, value)` → updates `bulkDataSignal`
   - Selects call `getReferenceOptions(field)` → `EntityRecordService.getReferenceOptions()` to populate options
   - Reference-list fields use `getRefListValues()` / `setRefListValues()` with caching to avoid infinite change detection

6. **Tab Navigation**: `onKeyDown()` handles Tab key
   - Moves focus to next field or next row
   - Auto-adds new row when tabbing from last cell in last row

7. **Row Management**:
   - `onClickAddRow()` → appends empty row to `bulkDataSignal`
   - `onClickRemoveRow(rowIndex)` → filters row from `bulkDataSignal`

8. **Save**: User clicks "Create All"
   - `onClickSave()`:
     - Filters out completely empty rows (checks all field values)
     - For each row with data: `EntityRecordService.createRecord(entityId, rowData)`
     - Navigates back to entity list (`/entity/:key`)

9. **Record Creation**: `EntityRecordService.createRecord()`
   - Generates unique ID via timestamp + random string
   - Creates `EntityRecord` object with entityId, id, data
   - Calls `EntityRecordStore.add(record)`

10. **State Update**: `EntityRecordStore.add()`
    - Updates `recordsSignal` with new record appended
    - Triggers effect logging updated records

## State Changes

- **EntityRecordStore.recordsSignal**: One new `EntityRecord` appended per non-empty row (via bulk create)
- **EntityRecordStore.records$**: Read-only signal updated when records change
- **EntityBulkCreatePageComponent.bulkDataSignal**: User-manipulated table data (rows, cell values)
- **EntityBulkCreatePageComponent.fieldModalState**: Field selection modal state (open/closed, pending/committed field set)
- **EntityBulkCreatePageComponent.refListValueCache**: Cache for reference-list field string→array conversions

## External Integrations

None. All data is stored in memory via Angular Signals in `EntityRecordStore`.

## Important Notes

- **Empty row filtering**: Only rows with at least one non-empty, non-whitespace field value are created
- **Reference-list caching**: Cache prevents infinite change detection by returning same array object when underlying CSV string unchanged
- **Display name fields**: Reference dropdowns show records by their `displayNameFieldId` or first field fallback
- **Backlink exclusion**: Backlink fields cannot be selected (read-only); only selectable types render in table
- **No persistence**: Records exist only in memory; no API calls or database interaction
