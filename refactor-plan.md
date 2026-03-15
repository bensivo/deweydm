# Refactoring Plan for Dewey DM Webapp

This document outlines refactoring opportunities across all pages to align with style guides and improve code quality.

---

## High Priority Refactors

### 2. **Standardize Reference List Cache Management**
**Location**: `entity-create.page.ts:54-55`, `entity-bulk-create.page.ts:53`, `entity-detail.page.ts:59-60`

**Issue**: Manual cache variables for reference-list values to avoid change detection loops:
```ts
private refListValueCache = '';
private refListValueCacheArray: string[] = [];
```
This pattern is repeated 3 times with slightly different implementations.

**Refactor**:
- Create `cache.util.ts` with a reusable cache class
- Or use computed signal with memoization: `computed(() => { /* parse once */ })`

**Impact**: Single source of truth for cache logic, reduces boilerplate.

---

### 3. **Fix Type Safety Issues**
**Location**: Multiple files

**Issues**:
- `entity-create.page.ts:57`: `@ViewChild('firstInput') firstInput: any;`
- `lists.page.ts:44`: Type assertion `e is any`
- `workspace-config.page.ts`: No proper error types in catch blocks

**Refactor**:
- Replace all `any` types with proper interfaces
- Create types for `EntityRecord`, component refs, etc.
- Add proper error type handling

**Impact**: Better type safety, IDE support, fewer runtime errors.

---

### 4. **Clean Up Window Event Listeners**
**Location**: `entity-list.page.ts:138-147`

**Issue**: Window keydown/keyup listeners are registered in `ngOnInit()` but never unregistered. This causes memory leaks when component is destroyed.

**Refactor**:
```ts
private destroyRef = inject(DestroyRef);

ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
}
```

**Impact**: Prevents memory leaks, proper cleanup on component destruction.

---

### 6. **Deduplicate Data Clear and Load Logic**
**Location**: `workspace-config.page.ts:119-141` and `172-194`

**Issue**: Template loading and import both clear existing data then load new data. The pattern is duplicated with only the data source different.

**Refactor**:
```ts
private clearWorkspaceData(): void {
    // Clear logic here
}

private loadWorkspaceData(entities, records, lists): void {
    // Load logic here
}
```

**Impact**: DRY principle, easier to maintain, consistent behavior.

---

### 7. **Extract Import/Export File Handling to Service**
**Location**: `workspace-config.page.ts:150-203`

**Issue**: File input creation, FileReader logic, and error handling mixed into component. This is not UI logic—it's a side effect.

**Refactor**:
- Move into `ImportExportService` (which already exists)
- Return observable with parsed data
- Let component handle UI state only

**Impact**: Separates concerns, testable file handling, cleaner component.

---

## Medium Priority Refactors

### 8. **Standardize Modal State Pattern**
**Location**: All pages using modals (`entity-config.page.ts`, `entity-list.page.ts`, `lists.page.ts`, `workspace-config.page.ts`)

**Issue**: All modals follow same pattern:
```ts
showModal = signal(false);
pendingData = signal(...);

onClickButton(): void {
    this.pendingData.set(new Set(this.selectedData()));
    this.showModal.set(true);
}

onConfirm(): void {
    this.selectedData.set(new Set(this.pendingData()));
    this.showModal.set(false);
}
```

**Refactor**:
- Create `ModalState<T>` utility class or composable
- Usage: `modal = new ModalState(initialValue)` with `open()`, `confirm()`, `cancel()` methods

**Impact**: Reduces boilerplate, consistent pattern, less error-prone.

---


### 10. **Standardize Event Handler Naming**
**Location**: `lists.page.ts:172`, `lists.page.ts:184`

**Issue**: Event handler `toggleColumn()` should be `onToggleColumn()` to follow naming convention. `getFieldName()` and `getFieldValue()` are getters, not event handlers.

**Refactor**:
- Rename all event handlers to start with `on`
- Move non-event getters to computed signals where applicable

**Impact**: Consistent naming, easier to distinguish event handlers from utilities.

---

### 12. **Fix Race Condition in lists.page.ts**
**Location**: `lists.page.ts:104-108`

**Issue**: `setTimeout()` with no delay suggests race condition. Computed should wait for list to be set.

**Refactor**:
```ts
// Use effect or computed with proper dependency
selectedColumnIds = signal<string[]>([]);

constructor() {
    effect(() => {
        const list = this.list$();
        if (list && this.selectedColumnIds().length === 0) {
            const defaultFields = this.availableFields$().slice(0, 2);
            this.selectedColumnIds.set(defaultFields.map(f => f.id));
        }
    });
}
```

**Impact**: No race conditions, reactive pattern.

---

### 13. **Use Private Accessor for entityRecordService**
**Location**: `entity-detail.page.ts:67`

**Issue**: `public entityRecordService` is exposed but should be private, with public getters/computeds instead.

**Refactor**:
```ts
// Make private
private entityRecordService: EntityRecordService

// Expose via computed if needed
protected getRecordDisplayName(...) { return this.entityRecordService.getRecordDisplayName(...) }
```

**Impact**: Proper encapsulation, less coupling.

---

### 14. **Standardize Inconsistent Signal Usage**
**Location**: `entity-config.page.ts:40-46`

**Issue**: Mixes plain properties and signals inconsistently:
```ts
newFieldName = '';  // ❌ plain property
newFieldType: FieldType = 'short-text';  // ❌ plain property
newFieldOptionValuesSignal = signal<string[]>([]);  // ✅ signal
```

**Refactor**:
- Either all form state should be signals, or all plain properties
- Recommendation: Use signals for consistency with other pages

**Impact**: Consistent pattern, easier to track state changes.

---

### 15. **Use Better User Feedback Than alert()**
**Location**: `workspace-config.page.ts:196, 198`

**Issue**: Using browser `alert()` is outdated and blocks execution.

**Refactor**:
- Create `NotificationService` using ng-zorro toast/message
- Or use NzMessageService from ng-zorro

**Impact**: Better UX, non-blocking, styled notifications.

---

## Low Priority / Code Quality

### 16. **Add Component Comments**
**Location**: All page files

**Issue**: No file-level comments explaining component purpose per TypeScript style guide.

**Refactor**:
```ts
// Entity create page - handles creation of new entity records with form validation
```

**Impact**: Better documentation, easier onboarding.

---

### 19. **Replace Multiple Signal Creation with Batch**
**Location**: `entity-bulk-create.page.ts:45-47`, `entity-list.page.ts:56-61`

**Issue**: Many signals created for related state.

**Refactor**:
```ts
// Group related signals
tableState = signal({
    selectedFieldIds: new Set<string>(),
    filterText: '',
    sortFieldId: '',
    sortOrder: null as 'asc' | 'desc' | null
});
```

**Impact**: Easier to manage related state, clearer intent.

---

## Summary

### Refactor Effort Breakdown:
- **High Priority** (7 items): ~2-3 days
  - High impact on code quality and maintainability
  - Extract utilities and services

- **Medium Priority** (8 items): ~1-2 days
  - Pattern standardization
  - Consistency improvements

- **Low Priority** (4 items): ~0.5-1 days
  - Code quality polish
  - Documentation

### Recommended Order:
1. High Priority #1-3 (utilities, types, listeners) - foundational
2. Medium Priority #8-9 (modal/set patterns) - high reuse
3. High Priority #4-7 (service extractions) - cleaner components
4. Medium Priority #10-15 (remaining standardization)
5. Low Priority #16-19 (polish)

---

## Notes

- All refactors should maintain backward compatibility with existing functionality
- Update relevant tests after each refactor
- Review style guides before implementing to ensure consistency
- Consider creating a `shared/` folder for utilities extracted from pages
