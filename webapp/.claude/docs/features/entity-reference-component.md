# Entity Reference Component

## Description
A reusable UI component that displays a clickable link to an entity record. Shows the record's display name as a blue hyperlink navigating to the entity detail page. Handles display name resolution with fallback logic and generates URL-safe route keys.

## Trigger
- **Display Context**: Rendered in entity-detail page for single reference fields, backlink fields, and reference-list fields
- **Display Context**: Rendered in entity-list page for reference and reference-list field cells
- **Display Context**: Rendered in lists page for items in custom list views
- **Runtime**: Component receives `recordId` input, computes display name and route on change detection

## Data Flow

1. **Component Input** (entity-reference.component.ts):
   - Parent template passes `[recordId]="someRecordId"` as required input signal

2. **Record Lookup** (entity-reference.component.ts):
   - `getRecord()` → `EntityRecordStore.getById(recordId)`
   - Returns EntityRecord or undefined

3. **Entity Lookup** (entity-reference.component.ts):
   - `getEntity()` → Get record → `EntityStore.getById(record.entityId)`
   - Returns Entity definition or undefined

4. **Display Name Resolution** (entity-reference.component.ts):
   - `getDisplayName()` uses Entity.displayNameFieldId if set
   - Falls back to Entity.fields[0].id if displayNameFieldId not configured
   - Accesses EntityRecord.data[displayFieldId] for the value
   - Ultimate fallback to record.id if field value is empty

5. **Route Key Generation** (entity-reference.component.ts):
   - `getEntityRouteKey()` calls `generateEntityKey(entity.name)`
   - `generateEntityKey()` (entity-key.util.ts) converts name to lowercase, replaces spaces/special chars with hyphens

6. **Template Rendering** (entity-reference.component.html):
   - Renders `<a [routerLink]="['/entity', routeKey, recordId()]">{{ displayName }}</a>`
   - RouterModule handles navigation to entity detail page
   - CSS class `.entity-reference` applies blue color and hover underline

## State Changes
- **No state mutations**: Component is pure display layer
- **Reactive updates**: Template auto-updates when recordId input changes (signals reactivity)
- **Dependent state reads**: Accesses EntityRecordStore.records$ and EntityStore.entities$ via stores

## External Integrations
- **Angular Router**: Uses RouterModule and [routerLink] for client-side navigation
- **NG-Zorro**: No direct NG-Zorro dependencies; pure Angular components

## Important Notes

- **Pure Presentation**: Component has no side effects, business logic, or mutations. Only reads stores and renders.

- **Display Name Chain**: displayNameFieldId → first field → record ID. Always has a fallback; safe to use in any context.

- **Store Reactivity**: Both EntityRecordStore and EntityStore use Signals. Component methods called from template trigger on Signal changes automatically.

- **Navigation Context**: Component doesn't know which entity type the record belongs to until runtime. Uses record.entityId to look up Entity definition.

- **Used in Three Contexts**:
  - Single reference fields in entity-detail (line 29)
  - Backlink fields in entity-detail (line 36)
  - Reference-list fields in entity-detail (line 44)
  - Reference fields in entity-list (line 78)
  - Reference-list fields in entity-list (line 84)
  - List items in lists page (line 19)

- **Route Format**: Navigates to `/entity/{entity-key}/{recordId}`, matched by EntityDetailPageComponent route params.

- **No Orphan Handling**: If record doesn't exist, falls back to displaying recordId. No error state.
