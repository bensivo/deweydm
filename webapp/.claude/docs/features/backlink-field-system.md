# Backlink Field System

## Description
Backlinks are read-only calculated fields that display records from another entity that reference the current record via a reference or reference-list field. They provide reverse navigation without storing data—if Entity A references Entity B, a backlink field on B automatically shows all A records pointing to B.

## Trigger
- User creates a backlink-type field in entity configuration page (`/config/:key`)
- User selects: source entity (entity with the reference field) + source field (the reference or reference-list field)
- Field becomes available on records of the target entity
- Backlink displays as a list of clickable links on the entity detail page

## Data Flow

1. **Field Creation**
   - User navigates to `EntityConfigPageComponent` (`entity-config.page.ts`)
   - Selects field type = "backlink" in modal form
   - `backlinkSourceFields$` computed signal filters source entity's reference/reference-list fields pointing to current entity (lines 64-75)
   - User selects source entity + source field, clicks "Add Field"
   - `onClickConfirmAddFieldButton()` calls `EntityService.addField()` with backlink config (lines 113-124)
   - `EntityService.addField()` (`entity.service.ts` lines 32-57) creates EntityField with `backlinkSourceEntityId` and `backlinkSourceFieldId`
   - `EntityStore.update()` adds field to entity schema

2. **Display on Detail Page**
   - User views record on `EntityDetailPageComponent` (`entity-detail.page.ts`)
   - Template iterates entity fields, renders backlink type fields (entity-detail.page.html lines 34-40)
   - `getBacklinkedRecords(field)` called for each backlink field (entity-detail.page.ts lines 170-181)
   - Method validates field has `backlinkSourceEntityId` and `backlinkSourceFieldId`
   - Calls `EntityRecordService.getBacklinkedRecords()` passing source entity/field IDs and current record ID

3. **Record Resolution**
   - `EntityRecordService.getBacklinkedRecords()` (`entity-record.service.ts` lines 102-125):
     - Fetches source entity schema from `EntityStore`
     - Fetches source field definition to determine type (reference vs reference-list)
     - Filters source entity's records by:
       - Reference type: exact match on record ID (line 115)
       - Reference-list type: parse comma-separated IDs and check inclusion (line 120)
     - Returns array of matching EntityRecord objects

4. **Link Rendering**
   - Template loops `getBacklinkedRecords(field)` results (entity-detail.page.html line 36)
   - For each backlinked record, renders `EntityReferenceComponent` with recordId
   - Component resolves record → entity → display name and generates route key (entity-reference.component.ts lines 33-71)
   - Template renders clickable link to `/entity/:routeKey/:recordId` (entity-reference.component.html lines 1-4)

## State Changes
- **EntityStore**: New EntityField with type='backlink' added to entity's fields array
- **EntityRecordStore**: No changes (backlinks are computed, not stored)
- **Component signals**:
  - `newFieldBacklinkSourceEntityIdSignal` (entity-config.page.ts line 43)
  - `newFieldBacklinkSourceFieldIdSignal` (entity-config.page.ts line 44)

## External Integrations
None. Backlinks are purely in-memory computed derived from existing reference fields. No database calls, APIs, or external systems involved.

## Important Notes
- **Read-only**: Backlink fields cannot be edited in edit mode; hidden from form (entity-detail.page.html line 23, entity-create.page.ts line 47)
- **Automatic**: No manual maintenance required. When reference/reference-list fields are updated, backlinks automatically reflect changes
- **Bidirectional**: Supports both reference (single) and reference-list (multiple) source fields via same filtering logic (lines 114-121 of entity-record.service.ts)
- **CSV parsing**: Reference-list values stored as comma-separated IDs; split/filtered via `String.split(',').includes()` (line 120)
- **Display fallback**: Backlinks render using source entity's `displayNameFieldId` resolved via `EntityReferenceComponent.getDisplayName()` (entity-reference.component.ts lines 53-61)
- **Empty state**: Shows "No linked records" text when no records reference current record (entity-detail.page.html line 35)
