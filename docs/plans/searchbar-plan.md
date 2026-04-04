# Searchbar Feature Implementation Plan

## Overview
Implement a functional global searchbar at the top of the application that allows users to search and find any record by the record's display name. The searchbar will use ng-zorro's autocomplete component to show matching results as the user types.

## Current State
- The searchbar exists in `app.html` (lines 8-13) as a simple text input with `nz-input` directive
- It's currently non-functional with no event handlers or autocomplete behavior
- The main app component (`app.ts`) controls the top nav and has access to all necessary services

## Data Model Context
- **Entity**: Represents a configurable type (e.g., Accounts, Projects, Tasks)
- **EntityRecord**: A single instance of an entity with data keyed by field IDs
- **DisplayName**: Each record is shown in dropdowns/links using its entity's `displayNameFieldId` field, with fallback to record ID
- Services available:
  - `EntityService`: Access to all entities
  - `EntityRecordService`: Access to all records and helper method `getRecordDisplayName(entityId, recordId)`

## Navigation Routes
Records are accessed via route `/entity/:key/:id` where:
- `:key` is the slugified entity name (generated via `generateEntityKey()`)
- `:id` is the record ID

## Implementation Plan

### 1. Create Search Store (`store/search.store.ts`)
- **Signal**: `searchQuery$` - tracks the current search input value
- **Signal**: `searchResults$` - stores formatted search results (id, recordName, entityName, entityKey)
- **Methods**:
  - `setQuery(query: string)`: Update search query and trigger search
  - `clearResults()`: Reset search state
- Search logic: Filter all records where display name contains the query (case-insensitive)

### 2. Create Search Service (`services/search.service.ts`)
- **Method**: `searchRecords(query: string)`: Search all records across all entities
  - Input: search query string
  - Output: Array of results with structure: `{ recordId, recordName, entityId, entityName, entityKey }`
  - Logic:
    1. Get all entities from `EntityService`
    2. For each entity, get all records of that entity type
    3. For each record, get its display name using `EntityRecordService.getRecordDisplayName()`
    4. Filter records where display name matches query (case-insensitive substring match)
    5. Map to result objects with record info + entity info + navigation key

### 3. Update App Component (`app.ts`)
- Inject `SearchService` and `SearchStore`
- Add methods:
  - `onSearchInput(event: Event)`: Call `searchStore.setQuery()` with input value
  - `onSearchSelect(result)`: Navigate to record using `router.navigate(['/entity', result.entityKey, result.recordId])`
  - Expose `searchResults$()` as getter for template
  - Expose `searchQuery$()` as getter for template

### 4. Update App Template (`app.html`)
Replace the plain input (lines 8-13) with ng-zorro autocomplete:
- Use `nz-auto-complete` directive
- Bind input value to `searchQuery$()`
- Bind `(input)` event to `onSearchInput()`
- Set `nzDataSource` to `searchResults$()`
- Add option template showing: `[recordName] (Entity: entityName)`
- On selection, call `onSearchSelect()` to navigate
- Include "No results" message when query is non-empty but no matches found

### 5. Update App Component Imports
Add `NzAutocompleteModule` to component imports

## Implementation Order
1. **Create search store** - Define state structure
2. **Create search service** - Implement search logic
3. **Update app.ts** - Wire up event handlers and services
4. **Update app.html** - Replace input with autocomplete component
5. **Test**: Manual testing by typing in searchbar and verifying results

## Edge Cases to Handle
- Empty search query: Show no results
- Special characters in display names: Include them in search matching
- Records with same display name in same entity: Both will appear (user can distinguish by ID in result)
- Very large number of records: Consider performance if hundreds of records exist (current MVP can handle this)
- Search results navigation: Must correctly map entity name to entity key using `generateEntityKey()`

## Notes
- Do NOT use RxJS Observables - use Signals throughout as per codebase pattern
- Follow TypeScript style guide: camelCase, long descriptive names, no default imports
- Follow LESS style guide for any styling (though minimal styling needed)
- Result matching is case-insensitive substring match on display name
- Must handle all entity types and record types uniformly
