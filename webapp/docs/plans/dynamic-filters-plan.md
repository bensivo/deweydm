# Dynamic Filters Feature for Entity List Page

## Overview
Add a dynamic filter UI to the entity-list page that allows users to build complex filter queries. Users can add multiple filters based on available columns and field types, with each filter supporting appropriate operators and values for that field type. Filters are applied progressively as the user adds them, narrowing down the displayed record set.

## Architecture

### Service-Based Filter Management

#### New `FilterService` (`src/app/services/filter.service.ts`)

The filter logic and state management is extracted into a reusable service:

**State Signals (managed by service)**:
- `filtersSignal`: WritableSignal<Filter[]> - array of active filters
  ```ts
  interface Filter {
    id: string;                    // unique identifier for each filter row (e.g., uuid)
    fieldId: string;               // which field to filter on
    operator: FilterOperator;      // comparison operator (varies by field type)
    value: string | string[];      // filter value(s)
  }
  ```

- `nextFilterIdSignal`: WritableSignal<number> - counter for generating unique filter IDs

**Computed Signals**:
- `filterOperatorsMapSignal`: Computed signal returning operator options per field type
  ```ts
  // Maps: fieldType -> available operators
  {
    'short-text': ['contains', 'equals', 'not-equals', 'starts-with', 'ends-with'],
    'long-text': ['contains', 'equals', 'not-equals'],
    'number': ['equals', 'not-equals', 'greater-than', 'less-than', 'greater-or-equal', 'less-or-equal'],
    'reference': ['equals', 'not-equals'],
    'reference-list': ['contains', 'not-contains'],
    'option': ['equals', 'not-equals'],
    'backlink': ['is-empty', 'is-not-empty']
  }
  ```

**Public Methods**:
- `getFilters(): Filter[]` - returns current filters (read-only snapshot)
- `getFiltersSignal(): Signal<Filter[]>` - returns signal for reactive updates
- `addFilter(fieldsFromEntity: EntityField[]): void` - append new empty filter
- `removeFilter(filterId: string): void` - remove filter by id
- `updateFilter(filterId: string, updates: Partial<Filter>): void` - update filter properties
- `getFilterOperatorsForFieldType(fieldType: FieldType): FilterOperator[]` - operators for field type
- `applyFiltersToRecords(records: EntityRecord[], filters: Filter[], entity: Entity, entityRecordService: EntityRecordService): EntityRecord[]` - filter records

**Filter Application Logic**:

**`applyFilter(record: EntityRecord, filter: Filter, field: EntityField): boolean`**
- Returns true if record passes the filter, false otherwise
- For text fields ('short-text', 'long-text'):
  - 'contains': case-insensitive substring match
  - 'equals': case-insensitive exact match
  - 'not-equals': inverse of equals
  - 'starts-with': value starts with filter value
  - 'ends-with': value ends with filter value
  
- For numbers ('number'):
  - 'equals', 'not-equals', 'greater-than', 'less-than', 'greater-or-equal', 'less-or-equal'
  - Parse both value and filter as numbers before comparison
  
- For references ('reference', 'reference-list'):
  - 'equals': record's reference field matches filter value (single reference)
  - 'not-equals': inverse of equals
  - 'contains': comma-separated IDs contain filter value (reference-list)
  - 'not-contains': inverse of contains
  
- For options ('option'):
  - 'equals': option value matches filter value
  - 'not-equals': inverse
  
- For backlinks ('backlink'):
  - 'is-empty': no records reference this record
  - 'is-not-empty': at least one record references this record
  - Call `EntityRecordService.getBacklinkedRecords()` to check

#### Component Integration

**EntityListPageComponent** uses FilterService:
- Inject `FilterService`
- Bind template to `filterService.getFiltersSignal()`
- Call `filterService.addFilter()`, `filterService.removeFilter()`, `filterService.updateFilter()` on user interactions
- Update `filteredAndSortedRecords$` computed signal to use `filterService.applyFiltersToRecords()`

### UI Components

#### Filter Builder UI
Add a new "Filters" section in `entity-list.page.html` after the toolbar and before the table:

```html
<div class="filters-section" *ngIf="filtersSignal().length > 0 || showAddFilterOption">
  <div class="filters-header">
    <h3>Filters</h3>
    <button nz-button nzType="text" (click)="onClickAddFilterButton()">+ Add Filter</button>
  </div>
  
  <div class="filter-rows">
    <div *ngFor="let filter of filtersSignal()" class="filter-row">
      <!-- Field Selector Dropdown -->
      <nz-select
        class="filter-field-select"
        [(ngModel)]="filter.fieldId"
        (ngModelChange)="onFilterFieldChange(filter.id, $event)">
        <nz-option *ngFor="let field of entity$()!.fields"
          [nzLabel]="field.name"
          [nzValue]="field.id">
        </nz-option>
      </nz-select>
      
      <!-- Operator Selector Dropdown -->
      <nz-select
        class="filter-operator-select"
        [(ngModel)]="filter.operator"
        (ngModelChange)="onFilterOperatorChange(filter.id, $event)">
        <nz-option *ngFor="let op of getFilterOperatorsForFieldType(getFieldById(filter.fieldId)!.type)"
          [nzLabel]="getOperatorLabel(op)"
          [nzValue]="op">
        </nz-option>
      </nz-select>
      
      <!-- Value Input (varies by field type and operator) -->
      <!-- Text input for text fields -->
      <input
        *ngIf="isTextFieldType(getFieldById(filter.fieldId)!.type) && !isEmptyOperator(filter.operator)"
        nz-input
        class="filter-value-input"
        type="text"
        [value]="filter.value as string"
        (input)="onFilterValueChange(filter.id, ($event.target as HTMLInputElement).value)" />
      
      <!-- Number input for number fields -->
      <input
        *ngIf="getFieldById(filter.fieldId)!.type === 'number' && !isEmptyOperator(filter.operator)"
        nz-input
        class="filter-value-input"
        type="number"
        [value]="filter.value as string"
        (input)="onFilterValueChange(filter.id, ($event.target as HTMLInputElement).value)" />
      
      <!-- Reference selector (dropdown) -->
      <nz-select
        *ngIf="isReferenceFieldType(getFieldById(filter.fieldId)!.type) && !isEmptyOperator(filter.operator)"
        class="filter-value-select"
        [(ngModel)]="filter.value"
        (ngModelChange)="onFilterValueChange(filter.id, $event)">
        <nz-option *ngFor="let option of getReferenceFilterOptions(getFieldById(filter.fieldId)!)"
          [nzLabel]="option.label"
          [nzValue]="option.id">
        </nz-option>
      </nz-select>
      
      <!-- Option selector (dropdown) -->
      <nz-select
        *ngIf="getFieldById(filter.fieldId)!.type === 'option' && !isEmptyOperator(filter.operator)"
        class="filter-value-select"
        [(ngModel)]="filter.value"
        (ngModelChange)="onFilterValueChange(filter.id, $event)">
        <nz-option *ngFor="let optionValue of getFieldById(filter.fieldId)!.optionValues || []"
          [nzLabel]="optionValue"
          [nzValue]="optionValue">
        </nz-option>
      </nz-select>
      
      <!-- Remove Button -->
      <button nz-button nzType="text" nzDanger (click)="onClickRemoveFilterButton(filter.id)">
        <i nz-icon nzType="close" nzTheme="outline"></i>
      </button>
    </div>
  </div>
  
  <div class="filters-footer">
    <button nz-button nzType="primary" (click)="onClickAddFilterButton()">+ Add Another Filter</button>
  </div>
</div>
```

#### Collapsed Filters Badge
When filters are active, show a badge near the "Columns" button:
```html
<div class="toolbar-filters-badge" *ngIf="filtersSignal().length > 0">
  <span class="badge">{{ filtersSignal().length }} Filter{{ filtersSignal().length !== 1 ? 's' : '' }}</span>
</div>
```

### Helper Methods in EntityListPageComponent

These are UI-specific helpers used by the template and event handlers:

**`getFieldById(fieldId: string): EntityField | undefined`**
- Finds field from current entity by id

**`getOperatorLabel(operator: FilterOperator): string`**
- Returns human-readable label for operator (e.g., 'contains' → 'Contains', 'starts-with' → 'Starts With')

**`isTextFieldType(fieldType: FieldType): boolean`**
- Returns true for 'short-text', 'long-text'

**`isReferenceFieldType(fieldType: FieldType): boolean`**
- Returns true for 'reference', 'reference-list'

**`isEmptyOperator(operator: FilterOperator): boolean`**
- Returns true for 'is-empty', 'is-not-empty' (no value input needed)

**`getReferenceFilterOptions(field: EntityField): { id: string; label: string }[]`**
- Calls existing `EntityRecordService.getReferenceOptions(field)` to get available records
- Maps to `[{ id: recordId, label: displayName }]` format

**`onFilterFieldChange(filterId: string, newFieldId: string): void`**
- Calls `filterService.updateFilter()` with new fieldId
- Resets value and operator to defaults when field changes

**`onFilterOperatorChange(filterId: string, newOperator: FilterOperator): void`**
- Calls `filterService.updateFilter()` with new operator

**`onFilterValueChange(filterId: string, newValue: string | string[]): void`**
- Calls `filterService.updateFilter()` with new value

**`onClickAddFilterButton(): void`**
- Calls `filterService.addFilter(this.entity$().fields)` to append new empty filter

**`onClickRemoveFilterButton(filterId: string): void`**
- Calls `filterService.removeFilter()` to remove filter by id

## Data Flow

1. User clicks "+ Add Filter" button in toolbar or filters section
2. `onClickAddFilterButton()` → `filterService.addFilter(fields)` → appends new Filter object to service's `filtersSignal`
3. Template reads from `filterService.getFiltersSignal()`, filter row renders with empty/default field, operator, value
4. User selects field from dropdown → `onFilterFieldChange()` → `filterService.updateFilter()` → service updates `filtersSignal`
5. Service's `filterOperatorsMapSignal` updates, operator dropdown shows only operators valid for selected field type
6. User selects operator → `onFilterOperatorChange()` → `filterService.updateFilter()` → service updates `filtersSignal`
7. Value input/selector appears (type/style determined by field type and operator)
8. User enters filter value → `onFilterValueChange()` → `filterService.updateFilter()` → service updates `filtersSignal`
9. `filteredAndSortedRecords$` computed signal re-evaluates:
   - Call `filterService.applyFiltersToRecords(records, filterService.getFilters(), entity, entityRecordService)`
   - Service iterates records, applies all filters with AND logic
   - Returns filtered results
   - Apply existing text search and sorting
10. Table re-renders with filtered results
11. User can add more filters by clicking "+ Add Another Filter" button
12. User can remove filters by clicking X button on filter row
13. When filter is removed, service updates `filtersSignal`, component's `filteredAndSortedRecords$` recalculates and table updates

## State Changes

**FilterService-Level Signals** (managed centrally):
- `filtersSignal`: Updated by `addFilter()`, `removeFilter()`, `updateFilter()`
- `nextFilterIdSignal`: Auto-incremented on each new filter
- `filterOperatorsMapSignal`: Computed, no direct updates needed

**Component-Level Signals**:
- Existing signals unchanged: `filterTextSignal`, `sortFieldIdSignal`, `sortOrderSignal`, `selectedRecordIdsSignal`, etc.

**Computed Signals**:
- `filteredAndSortedRecords$`: Enhanced to call `filterService.applyFiltersToRecords()` before sorting
- No new stores needed; filter state is managed in FilterService for reusability

## No External Integrations Required
Filters are applied entirely in-memory on existing record data. No API calls, no persistence, no new services or stores.

## Styling

Add to `entity-list.page.less`:

```less
.filters-section {
    margin-bottom: 16px;
    padding: 12px 16px;
    background-color: #f5f5f5;
    border-radius: 8px;
    
    .filters-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        h3 {
            margin: 0;
            font-size: 14px;
            font-weight: 500;
            color: #262626;
        }
    }
    
    .filter-rows {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
    }
    
    .filter-row {
        display: flex;
        gap: 8px;
        align-items: center;
        
        .filter-field-select,
        .filter-operator-select,
        .filter-value-input,
        .filter-value-select {
            flex: 1;
            min-width: 120px;
        }
        
        button {
            flex-shrink: 0;
        }
    }
    
    .filters-footer {
        text-align: center;
    }
}

.toolbar-filters-badge {
    display: inline-block;
    margin-left: 8px;
    
    .badge {
        display: inline-block;
        padding: 4px 8px;
        background-color: #e6f4ff;
        color: #1890ff;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
    }
}
```

## Type Definitions

Add to `src/app/models/entity.model.ts` or new file `src/app/models/filter.model.ts`:

```ts
export type FilterOperator = 
    | 'contains' | 'equals' | 'not-equals' | 'starts-with' | 'ends-with'
    | 'greater-than' | 'less-than' | 'greater-or-equal' | 'less-or-equal'
    | 'is-empty' | 'is-not-empty';

export interface Filter {
    id: string;
    fieldId: string;
    operator: FilterOperator;
    value: string | string[];
}
```

## Implementation Steps

1. **Add type definitions** to `src/app/models/filter.model.ts`
   - Define `FilterOperator`, `Filter` interfaces
   - Export to be used in service and component

2. **Create FilterService** (`src/app/services/filter.service.ts`)
   - Inject `EntityRecordService` (for backlink filtering)
   - Initialize `filtersSignal`, `nextFilterIdSignal`
   - Implement `filterOperatorsMapSignal` computed
   - Implement public methods: `getFilters()`, `getFiltersSignal()`, `addFilter()`, `removeFilter()`, `updateFilter()`, `getFilterOperatorsForFieldType()`
   - Implement `applyFilter()` private method for each field type/operator combination
   - Implement `applyFiltersToRecords()` public method to filter array of records

3. **Update EntityListPageComponent** (`src/app/pages/entity-list/entity-list.page.ts`)
   - Inject `FilterService`
   - Remove filter state signals (moved to service)
   - Keep UI-specific helper methods: `getFieldById()`, `getOperatorLabel()`, `isTextFieldType()`, `isReferenceFieldType()`, `isEmptyOperator()`, `getReferenceFilterOptions()`
   - Implement event handlers: `onFilterFieldChange()`, `onFilterOperatorChange()`, `onFilterValueChange()`, `onClickAddFilterButton()`, `onClickRemoveFilterButton()`
   - Update `filteredAndSortedRecords$` computed to call `filterService.applyFiltersToRecords()`

4. **Update entity-list template** (`src/app/pages/entity-list/entity-list.page.html`)
   - Bind filters section to `filterService.getFiltersSignal()`
   - Add filter count badge near columns button
   - Wire up click handlers and ngModel bindings to component methods

5. **Update entity-list styles** (`src/app/pages/entity-list/entity-list.page.less`)
   - Style filter section, rows, dropdowns, badge
   - Ensure responsive layout
   - Use design system colors and spacing

6. **Testing**
   - Add filters with various field types (text, number, reference, option)
   - Verify correct operators appear for each field type
   - Test AND logic with multiple filters
   - Test removing filters
   - Verify filtered results update as filters change
   - Test interaction with existing text search and sort
   - Test that FilterService can be injected and used in other components

## Dependencies
- Angular Signals (already in use)
- NG-Zorro components: Select, Input, Button, Icon (all already imported)
- Existing `EntityRecordService`, `EntityService`
- No new external libraries needed

## Files to Create/Modify

### New Files
- `/Users/bensivo/code/pdms/filters/webapp/src/app/models/filter.model.ts` (type definitions)
- `/Users/bensivo/code/pdms/filters/webapp/src/app/services/filter.service.ts` (filter state and logic)

### Modified Files
- `/Users/bensivo/code/pdms/filters/webapp/src/app/pages/entity-list/entity-list.page.ts` (inject service, UI handlers, update computed)
- `/Users/bensivo/code/pdms/filters/webapp/src/app/pages/entity-list/entity-list.page.html` (add filters section UI)
- `/Users/bensivo/code/pdms/filters/webapp/src/app/pages/entity-list/entity-list.page.less` (add filter styling)

## Important Notes

- **Filter logic is applied at component level** using in-memory record data; no backend filtering
- **AND logic only**: All active filters must match for record to appear (no OR logic currently)
- **Operators vary by type**: Text, number, reference, option, and backlink field types each have appropriate operators
- **No filter persistence**: Filters reset when user navigates away from list page
- **Reference filters**: When filtering by reference field, shows all records of referenced entity in dropdown (reuses existing `getReferenceOptions()` logic)
- **Backlink filtering**: 'is-empty' / 'is-not-empty' operators use existing `EntityRecordService.getBacklinkedRecords()` to determine if record is referenced
- **Empty operator edge case**: 'is-empty' and 'is-not-empty' operators don't need value input; the template uses `isEmptyOperator()` check
- **Performance**: Filters are re-evaluated on every record each time filters array changes; for large datasets (1000+ records) consider memoization or debouncing

## Future Enhancements
- OR logic: Allow combining filters with AND/OR operators
- Filter presets/templates: Save and reuse filter combinations
- Filter history: Remember recently used filters
- Date range filters: Add support for date field type
- Multi-select filter values: Allow "any of these" operator for option fields
- Filter persistence: Save filters in localStorage or user preferences
