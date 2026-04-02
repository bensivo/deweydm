# Workspace Config Feature

## Description
Central hub for managing entire workspace configuration: create/delete entities, create/rename/delete lists, load pre-built templates, and import/export workspace data. Provides quick-start templates (Project Tracker, CRM, Product Ideation) with pre-configured entities and sample data.

## Trigger
Navigated to via `/workspace-config` route. User interacts through modal dialogs and action buttons on the page.

## Data Flow

1. **Page Load** → `WorkspaceConfigPageComponent` constructor
   - Injects: `EntityService`, `TemplateService`, `EntityStore`, `EntityRecordStore`, `ImportExportService`, `ListService`, `ListsStore`
   - Calls `TemplateService.getAvailableTemplates()` → returns array of template metadata
   - Sets `availableTemplates` signal with 3 templates (project-tracker, crm, product-ideation)

2. **Entity Management**
   - User clicks "+ Add Entity" → `onClickAddEntityButton()` opens modal via `showCreateEntityModal` signal
   - User enters name/pluralName, clicks "Create" → `onClickCreateEntityButton()` → `EntityService.createEntity(name, pluralName)`
     - `EntityService.createEntity()` → generates ID, creates Entity object, calls `EntityStore.add(entity)`
     - `EntityStore.add()` updates `entitiesSignal` via `.update()`
   - User clicks "Delete" on entity → `onClickDeleteEntityButton(entityId)` → `EntityService.deleteEntity(entityId)` → `EntityStore.remove(id)`
   - URL key preview generated via `generateEntityKey()` util from entity name (lowercase, trim, replace spaces with hyphens)

3. **List Management**
   - User clicks "+ Add List" → `onClickAddListButton()` opens modal via `showCreateListModal` signal
   - User enters name, clicks "Create" → `onClickCreateListButton()` → `ListService.createList(name)`
     - `ListService.createList()` → generates ID, calls `ListsStore.createList(id, name)` → updates `listsSignal`
   - User clicks "Rename" → `onClickRenameListButton(id, currentName)` opens rename modal
   - User clicks "Confirm Rename" → `onClickConfirmRenameListButton()` → `ListService.renameList(id, newName)` → `ListsStore.rename(id, newName)`
   - User clicks "Delete" → `onClickDeleteListButton(id)` → `ListService.deleteList(id)` → `ListsStore.remove(id)`

4. **Template Loading Flow**
   - User clicks "Load Template" → `onClickLoadTemplateButton()` opens template selection modal via `showTemplateSelectionModal` signal
   - User selects template via radio button → `onSelectTemplate(templateId)` sets `selectedTemplate` property
   - User clicks "Next" → `onClickConfirmTemplateSelection()` closes selection modal, opens confirmation modal via `showTemplateConfirmModal` signal
   - User clicks "Load" on confirmation → `onClickConfirmTemplateLoad()`
     - Gets template data: `TemplateService.getTemplate(templateId)` → returns Template with entities[], records[], lists[]
     - **Clears all existing data:**
       - Iterates `EntityStore.getAll()` → calls `EntityService.deleteEntity()` for each
       - Iterates `EntityRecordStore.getAll()` → calls `EntityRecordStore.remove()` for each
       - Iterates `ListsStore.getAll()` → calls `ListsStore.remove()` for each
     - **Loads template data:**
       - Iterates template.entities → calls `EntityStore.add(entity)` for each
       - Iterates template.records → calls `EntityRecordStore.add(record)` for each
       - Iterates template.lists → calls `ListsStore.add(list)` for each
     - Closes confirmation modal

5. **Export Flow**
   - User clicks "Export Data" → `onClickExportButton()`
     - Collects data: `EntityStore.getAll()`, `EntityRecordStore.getAll()`, `ListsStore.getAll()`
     - Calls `ImportExportService.exportToJson(entities, records, lists)` → returns ExportData object with version, exportedAt timestamp
     - Calls `ImportExportService.downloadExport(exportData, filename)` → creates Blob, generates download URL, triggers click on auto-created `<a>` element

6. **Import Flow**
   - User clicks "Import Data" → `onClickImportButton()`
     - Calls `ImportExportService.openImportFileDialog()` → creates `<input type="file">` DOM element, opens file picker
       - On file select → reads file as text via `FileReader`
       - Calls `ImportExportService.parseImportFile(fileContent)` → JSON.parse, validates structure (entities/records/lists arrays)
       - Returns Promise<ExportData>
     - On import data received:
       - **Clears all existing data** (same as template load)
       - **Loads imported data** (same as template load)
       - Shows success alert
     - On error → shows error alert with error message

## State Changes

| Signal/Property | Changed By | Effect |
|---|---|---|
| `entitiesSignal` | `EntityStore.add/update/remove` | Re-renders entity list; triggers store effect logging |
| `recordsSignal` | `EntityRecordStore.add/remove` | Clears when loading template/import; triggers store effect logging |
| `listsSignal` | `ListsStore.createList/add/rename/remove` | Updates visible lists in UI |
| `showCreateEntityModal` | User clicks "+Add Entity" / "Create" / "Cancel" | Opens/closes modal |
| `showCreateListModal` | User clicks "+Add List" / "Create" / "Cancel" | Opens/closes modal |
| `showRenameListModal` | User clicks "Rename" / "Confirm Rename" / "Cancel" | Opens/closes modal |
| `showTemplateSelectionModal` | User clicks "Load Template" / "Next" / "Cancel" | Opens/closes modal |
| `showTemplateConfirmModal` | User clicks "Next" / "Load" / "Cancel" | Opens/closes confirmation |
| `newEntityName`, `newEntityPluralName` | Component form input binding (ngModel) | Preview key updates |
| `newListName` | Component form input binding (ngModel) | Preview key updates |
| `selectedTemplate` | Radio button selection / user action | Tracks active template choice |

## External Integrations

- **Browser File API**: `ImportExportService.openImportFileDialog()` uses `<input type="file">` and `FileReader` to load JSON from user's filesystem
- **Browser Download**: `ImportExportService.downloadExport()` uses `Blob` and `URL.createObjectURL()` to trigger file download
- **Browser DOM**: Dynamically creates `<a>` and `<input>` elements for file I/O

## Important Notes

- **Data Loss on Template Load**: Loading a template permanently clears ALL existing entities, records, and lists. Confirmation modal warns users with danger styling on button.
- **Template Service**: Hardcodes 3 templates with complete entity schemas and sample EntityRecord data. See `TemplateService` for template definitions (project-tracker, crm, product-ideation).
- **Import Validation**: `ImportExportService.validateImportData()` requires entities and records arrays; lists array is optional for backwards compatibility.
- **ID Generation**: Entity IDs, List IDs, and List item IDs all generated via `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` pattern.
- **Display Name Fields**: Each entity in templates can set optional `displayNameFieldId` property used elsewhere when displaying entity records in dropdowns/references.
- **No Backend**: All data stored in memory via Signals. No persistence to server; data lost on page refresh.
- **URL Keys**: Generated deterministically from entity/list names via `generateEntityKey()` util for readable URLs in configure routes.
