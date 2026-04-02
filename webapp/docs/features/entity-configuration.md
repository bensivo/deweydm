# Entity Configuration Feature

## Description
Allows users to configure custom entity schemas by adding, removing, and managing fields of various types (text, number, reference, option, backlink). Users can also set which field serves as the display name when the entity is referenced elsewhere.

## Trigger
User navigates to `/workspace-config` and clicks "Configure" on an entity card, routing to `/workspace-config/entity/:key`.

## Data Flow

1. **Route Entry**: `ActivatedRoute.params` provides entity key to `EntityConfigPageComponent.ngOnInit()`
2. **Entity Resolution**: `entityKeySignal.set(key)` triggers `entity$` computed signal
3. **Lookup**: `entity$` computed() calls `generateEntityKey()` utility and `EntityService.entities$()` to find matching entity
4. **Fallback Navigation**: If entity not found, redirects to `/workspace-config`
5. **Add Field Flow**:
   - User clicks "Add Field" button → `onClickAddFieldButton()` resets form state and opens modal
   - User fills form (name, type, optional reference/backlink/option config) → updates local component properties
   - User confirms → `onClickConfirmAddFieldButton()` constructs field config object and calls `EntityService.addField()`
   - `EntityService.addField()` creates `EntityField` object with generated ID and calls `EntityStore.update()`
   - `EntityStore.update()` patches entity signal with new fields array
6. **Remove Field Flow**: `onClickRemoveFieldButton()` → `EntityService.removeField()` → `EntityStore.update()` filters field out
7. **Set Display Name**: `onChangeDisplayNameField()` → `EntityService.setDisplayNameField()` → `EntityStore.update()` sets `displayNameFieldId`

## State Changes

- **Component local state**: `showAddFieldModal`, `newFieldName`, `newFieldType`, `newFieldReferenceEntityId`, `newFieldBacklinkSourceEntityIdSignal`, `newFieldBacklinkSourceFieldIdSignal`, `newFieldOptionValuesSignal`
- **EntityStore signal**: `entitiesSignal` updated with new/removed/modified fields; `displayNameFieldId` set

## External Integrations

None. All operations are in-memory signal updates. No API calls or persistence layer involved.

## Important Notes

- **Entity key generation**: Uses `generateEntityKey()` utility which converts entity name to lowercase, replaces whitespace with hyphens, removes special characters
- **Backlink field dependencies**: When creating backlink fields, dropdown of source fields is dynamically computed based on selected source entity—only shows reference/reference-list fields pointing to current entity
- **Modal form validation**: Minimal validation; add field confirms only if `newFieldName` present; no field name uniqueness validation
- **Computed selectors**: `referencableEntities$` and `backlinkSourceFields$` are reactive and update when entity selections change
- **Option field values**: Stored as string array; added via input field with Enter key or button click
- **No persistence**: Changes exist only in signal-based store; no backend sync or localStorage
