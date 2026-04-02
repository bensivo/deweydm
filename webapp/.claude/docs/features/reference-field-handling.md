# Reference Field Handling

## Description
Reference fields enable records to link to other records, supporting both single references (reference) and multiple references (reference-list). The system stores reference IDs as comma-separated values and provides lookup utilities to resolve display names, backlinks, and navigation routes.

## Trigger
- **Creation**: Reference/reference-list fields configured in entity schema with `referenceEntityId`
- **Display**: Rendering entity detail or list views with reference fields
- **Edit**: User selects/changes a reference in create or detail page forms
- **Navigation**: User clicks a reference link to navigate to referenced record

## Data Flow

1. **Entity Configuration** (`entity.service.ts`):
   - `addField()` creates field with `referenceEntityId` pointing to target entity

2. **Form Display** (entity-create/entity-detail pages):
   - Template renders `nz-select` for reference fields (single) or `nz-select[nzMode="multiple"]` for reference-list fields
   - Calls `getReferenceOptions(field)` to populate dropdown

3. **Option Population** (`entity-record.service.ts`):
   - `getReferenceOptions()` retrieves all records of target entity via `getByEntityId()`
   - Maps records to `{ recordName, recordId }` using `getRecordDisplayName()` for labels

4. **Display Name Resolution** (`entity-record.service.ts`):
   - `getRecordDisplayName()` looks up entity's `displayNameFieldId`
   - Falls back to first field if not configured, then record ID as ultimate fallback
   - Used in dropdowns and reference components

5. **Reference Link Rendering** (entity-detail page):
   - Reference field view mode: Renders `<app-entity-reference [recordId]="...">` component
   - Reference-list field view mode: Loops through CSV IDs, renders multiple reference components

6. **Entity Reference Component** (`entity-reference.component.ts`):
   - Accepts `recordId` input signal
   - Retrieves record via `EntityRecordStore.getById()`
   - Fetches entity via `EntityStore.getById(record.entityId)`
   - Computes display name and route key
   - Template renders as `<a [routerLink]>` link

7. **Reference-List Parsing** (`entity-record.service.ts`):
   - `getRefListItems()` splits CSV value by comma
   - Returns array of EntityRecord objects for iteration in template

8. **Data Storage** (form → service → store):
   - Single reference: Stores record ID as string
   - Reference-list: Stores comma-separated record IDs (e.g., "id1,id2,id3")
   - `EntityRecordService.createRecord()` or `updateRecord()` persists to `EntityRecordStore`

## State Changes
- **Entity Schema**: `Entity.fields` array includes field with `referenceEntityId`
- **Display Config**: `Entity.displayNameFieldId` determines reference label rendering
- **Record Data**: `EntityRecord.data[fieldId]` contains reference ID(s)
- **UI State**: Form mode (create/edit) vs view mode determines field rendering

## External Integrations
None. All reference resolution happens in-memory from Signal-based stores.

## Important Notes

- **CSV Storage**: Reference-list fields store comma-separated IDs without whitespace (e.g., "id1,id2,id3"). Cache invalidation via `refListValueCache` in pages prevents infinite change detection loops.

- **Display Name Fallback Chain**: displayNameFieldId → first field → record ID. Always safe; no null pointer risk.

- **Backlinks**: Separate feature using `getBacklinkedRecords()`. Query source entity records where reference/reference-list field contains target record ID. Not triggered by reference field changes, computed on-demand.

- **Route Navigation**: `generateEntityKey()` converts entity names to URL-safe slugs. Reference component uses this to build `[routerLink]` to detail page.

- **No Referential Integrity**: Deleting a referenced record doesn't clean up references. Orphaned record IDs remain in reference fields.
