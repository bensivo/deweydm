# Entity Detail Feature

## Description
Displays a single entity record with all field values. Users can view, edit, and delete records. Supports multiple field types including references, reference lists, and backlinks. Fields are rendered contextually—reference fields show clickable links, reference lists and backlinks display as link lists, and basic text/number/option fields render as plain text in view mode.

## Trigger
Accessed via route `/entity/:key/:id` where `:key` is the URL-friendly entity name and `:id` is the record ID. Typically navigated from EntityListPageComponent or by following a reference link.

## Data Flow

1. **Route Navigation** → `app.routes.ts` (line 18) routes to `EntityDetailPageComponent`
2. **Component Initialization** → `entity-detail.page.ts:ngOnInit()` (line 71-78)
   - Extracts `:key` and `:id` from `ActivatedRoute.params`
   - Sets `entityKeySignal` and `recordIdSignal`
   - Validates entity and record exist; redirects home if not
3. **Entity & Record Lookup** → Computed signals (lines 41-50)
   - `entity$()` computed signal finds entity by comparing generated key against `EntityService.entities$()`
   - `record$()` computed signal finds record by ID from `EntityRecordService.records$()`
4. **Template Rendering** → `entity-detail.page.html` (lines 6-112)
   - For each field in `entity$().fields`, render appropriate view based on field type
   - Reference fields → `EntityReferenceComponent` (imported, lines 18, 32)
   - Backlink fields → fetch linked records via `getBacklinkedRecords()` (line 170), render list of `EntityReferenceComponent`
   - Reference-list fields → fetch items via `getRefListViewItems()` (line 161), render list of `EntityReferenceComponent`
   - Basic fields (short-text, long-text, number, option) → render as plain text
5. **Edit Mode Entry** → `onClickEdit()` (line 97-102)
   - Copies current `record.data` into `editData` signal (working copy)
   - Sets `isEditMode` to true
   - Template re-renders with input controls for each field type
6. **Field Value Updates** → `setEditValue()` (line 89-91)
   - Updates `editData` signal with user input from inputs/selects
   - For reference-list fields, calls `setRefListValues()` which joins array into CSV (line 156-158)
7. **Save Operation** → `onClickSave()` (line 109-113)
   - Calls `EntityRecordService.updateRecord()` with record ID and edited data
   - Service delegates to `EntityRecordStore.update()` which updates signal
   - Sets `isEditMode` to false
8. **Delete Operation** → `onClickDelete()` and `onConfirmDelete()` (line 116-127)
   - Opens confirm modal (line 117)
   - On confirm: calls `EntityRecordService.deleteRecord()`
   - Service delegates to `EntityRecordStore.remove()` which removes from signal
   - Navigates back to entity list page

### Supporting Methods

- **`EntityRecordService.getRecordDisplayName()`** (entity-record.service.ts:76-91) — Resolves display name for referenced records using entity's `displayNameFieldId`
- **`EntityRecordService.getBacklinkedRecords()`** (entity-record.service.ts:102-125) — Filters records from source entity where reference/reference-list field points to current record
- **`EntityRecordService.getReferenceOptions()`** (entity-record.service.ts:136-143) — Returns list of records that can be referenced for a reference field
- **`EntityRecordService.getRefListItems()`** (entity-record.service.ts:166-176) — Parses CSV recordIds into EntityRecord objects
- **`EntityReferenceComponent.getDisplayName()`** (entity-reference.component.ts:53-61) — Renders display name and route link for referenced record
- **`generateEntityKey()`** (entity-key.util.ts:5-11) — Converts entity name to URL-friendly slug

## State Changes

- **Local Component State:**
  - `isEditMode`: false → true when editing, false when saved/cancelled
  - `isDeleteConfirmModalOpen`: false → true when delete clicked, false when confirmed/cancelled
  - `editData`: empty → populated with record.data when entering edit mode → cleared when exiting

- **Application State:**
  - On save: `EntityRecordStore.recordsSignal` updated with new data for matching record ID
  - On delete: `EntityRecordStore.recordsSignal` filtered to remove record by ID
  - State updates trigger computed signals (`entity$()`, `record$()`) which re-render template

## External Integrations

No external APIs or databases. All data is in-memory signal-based state management via `EntityRecordStore` and `EntityStore`. No persistence layer.

## Important Notes

- **Validation:** Route guard redirects to home if entity/record not found (line 75-76)
- **Reference Display:** Uses entity's `displayNameFieldId` if configured; falls back to first field or record ID
- **Reference Lists:** Stored as comma-separated values in data; split/joined on edit (line 150-158)
- **Backlinks:** Read-only calculated field type; filtering happens in service based on reference field direction
- **Template Caching:** Reference-list component uses `refListValueCache` to avoid recreating arrays on every change detection (line 59-60, 149-152)
- **NG-Zorro Components:** Textareas use `nzAutosize` for dynamic height; selects use `nzMode="multiple"` for multi-select
