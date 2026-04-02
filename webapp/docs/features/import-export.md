# Import/Export Feature

## Description
Allows users to export all workspace data (entities, records, and lists) as JSON files for backup or data transfer, and import previously exported JSON files to restore or transfer data between instances.

## Trigger
User clicks "Export Data" or "Import Data" buttons in the Import/Export section of the workspace configuration page (`/workspace-config`).

## Data Flow

1. **Export Flow**
   - `WorkspaceConfigPageComponent.onClickExportButton()` (workspace-config.page.ts:150)
   - Calls `EntityStore.getAll()` → returns all Entity objects
   - Calls `EntityRecordStore.getAll()` → returns all EntityRecord objects
   - Calls `ListsStore.getAll()` → returns all List objects
   - Calls `ImportExportService.exportToJson(entities, records, lists)` (import-export.service.ts:21)
     - Returns `ExportData` object with version, exportedAt timestamp, and all three data arrays
   - Calls `ImportExportService.downloadExport(exportData, filename)` (import-export.service.ts:34)
     - Serializes to JSON string
     - Creates Blob and downloads via browser download mechanism with timestamped filename

2. **Import Flow**
   - `WorkspaceConfigPageComponent.onClickImportButton()` (workspace-config.page.ts:159)
   - Calls `ImportExportService.openImportFileDialog()` (import-export.service.ts:78)
     - Creates native file input element filtered to `.json` files
     - On selection, reads file via FileReader API
     - Calls `ImportExportService.parseImportFile(fileContent)` (import-export.service.ts:48)
       - Parses JSON and validates structure via `validateImportData()` (import-export.service.ts:61)
       - Returns parsed `ExportData` object or throws error
   - On success, clears existing data:
     - Iterates `EntityStore.getAll()` and calls `EntityService.deleteEntity()` for each
     - Iterates `EntityRecordStore.getAll()` and calls `EntityRecordStore.remove()` for each
     - Iterates `ListsStore.getAll()` and calls `ListsStore.remove()` for each
   - Loads imported data:
     - Iterates imported entities and calls `EntityStore.add(entity)` for each
     - Iterates imported records and calls `EntityRecordStore.add(record)` for each
     - Iterates imported lists and calls `ListsStore.add(list)` for each
   - Shows success/error alert to user

## State Changes

### Export
- No state changes; read-only operation

### Import
- **EntityStore**: All previous entities removed, new entities added
- **EntityRecordStore**: All previous records removed, new records added
- **ListsStore**: All previous lists removed, new lists added

## External Integrations
None. Uses browser APIs only:
- **FileReader API** - for reading uploaded JSON files
- **Blob/URL.createObjectURL()** - for download mechanism
- **Native file input element** - for file selection dialog

## Important Notes

- Export includes version ('1.0') and ISO timestamp for tracking
- Import validates required structure (entities and records arrays must exist; lists optional for backwards compatibility)
- Lists support optional backwards compatibility - old exports without lists field can still be imported
- Import completely wipes workspace before loading - no merge behavior
- No error recovery; failed import shows alert with error message
- File operations are synchronous from user perspective (FileReader onload callback)
- Exported filename is timestamped as `dewey-dm-export-YYYY-MM-DD.json`
