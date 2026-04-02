# Signal-Based Store Pattern

## Description

Signal-based store pattern is the core state management architecture for Dewey DM. It uses Angular's `Signal` API to create reactive, immutable state containers that trigger automatic updates to components without observables. Two primary stores implement this pattern:

- **EntityStore** - Manages entity schema definitions (name, fields, types)
- **EntityRecordStore** - Manages entity record instances (actual data records)

Both are singleton services injected at the root level (`providedIn: 'root'`).

---

## Trigger

Stores are injected into services via constructor dependency injection:
- Services (EntityService, EntityRecordService) inject stores
- Components never inject stores directly; they use services instead
- Signals auto-update via Angular's reactivity system when `signal.update()` or `signal.set()` is called

---

## Data Flow

### EntityStore Initialization & Usage

1. **Initialization**: `EntityStore` constructor creates `entitiesSignal = signal<Entity[]>([])` with empty array
2. **Setup effect**: `effect(() => { ... })` logs whenever entities change
3. **Expose read-only**: `entities$ = this.entitiesSignal.asReadonly()` exposed publicly for consumption
4. **Service injection**: `EntityService` injects `EntityStore`
5. **EntityService.createEntity()** calls `this.entityStore.add(entity)` → updates signal
6. **Signal update**: `entitiesSignal.update(entities => [...entities, entity])`
7. **Reactive propagation**: All components reading `entityService.entities$()` auto-update via computed signals
8. **Component flow**: Components use `entity$ = computed(() => { this.entityService.entities$() ... })`

### EntityRecordStore Initialization & Usage

1. **Initialization**: `EntityRecordStore` creates `recordsSignal = signal<EntityRecord[]>([])`
2. **Setup effect**: Logs record changes
3. **Expose read-only**: `records$ = this.recordsSignal.asReadonly()`
4. **Service injection**: `EntityRecordService` injects `EntityRecordStore` and `EntityStore`
5. **EntityRecordService.createRecord()** calls `this.entityRecordStore.add(record)`
6. **Signal mutation**: `recordsSignal.update(records => [...records, record])`
7. **Component consumption**:
   - EntityListPageComponent: `records$ = computed(() => this.entityRecordService.records$().filter(...))`
   - EntityDetailPageComponent: `record$ = computed(() => this.entityRecordService.records$().find(...))`

### Complete Request Path Example (Create Record)

1. User clicks "+ New" button → `onClickNewButton()` in EntityListPageComponent
2. Navigates to `/entity-create/[key]`
3. EntityCreatePageComponent loads, user fills form, clicks "Create"
4. Component calls `this.entityRecordService.createRecord(entityId, data)`
5. Service calls `this.entityRecordStore.add(record)`
6. Store updates: `recordsSignal.update(records => [...records, record])`
7. Signal triggers `effect()` logging
8. All components reading `records$()` via computed signals re-run their computations
9. EntityListPageComponent's `records$()` computed signal re-evaluates automatically
10. Angular detects change and re-renders table with new record

---

## State Changes

### EntityStore State Mutations

**add(entity)**: Appends entity to signal array
```
entitiesSignal: [] → [..., entity]
```

**update(id, partial)**: Merges partial into matching entity
```
entitiesSignal: [e1, e2] → [e1, {...e2, ...partial}]
```

**remove(id)**: Filters out entity by id
```
entitiesSignal: [e1, e2, e3] → [e1, e3] (if removing e2)
```

### EntityRecordStore State Mutations

**add(record)**: Appends record to signal array
```
recordsSignal: [] → [..., record]
```

**update(id, partial)**: Merges partial into matching record.data
```
recordsSignal: [r1, r2] → [r1, {...r2, data: {...r2.data, ...partial.data}}]
```

**remove(id)**: Filters out record by id
```
recordsSignal: [r1, r2, r3] → [r1, r3] (if removing r2)
```

**getByEntityId(entityId)**: Filters records by entityId (no mutation)
```
Query: records where record.entityId === entityId
```

---

## External Integrations

**No external integrations.** Both stores are in-memory only. They:
- Do NOT persist to database or localStorage
- Do NOT call HTTP APIs (that's handled by services if needed later)
- Do NOT integrate with message brokers or external systems

Data is lost on page reload unless persisted separately.

---

## Important Notes

1. **Immutability**: All mutations use `signal.update()` with spread operators to ensure immutability
2. **No direct mutations**: Never modify arrays/objects directly; always use `update()` or `set()`
3. **Read-only exposure**: Stores expose `asReadonly()` to prevent components from calling store methods directly
4. **Service layer required**: Components must use services (EntityService, EntityRecordService), never inject stores
5. **Computed signals are key**: Components use `computed()` to derive filtered/transformed state from store signals
6. **Effects for side effects**: Store constructors use `effect()` for logging; services can use effects for validation/reactions
7. **No observable conversion**: Unlike traditional NgRx, signals don't convert to observables (no `.asObservable()` needed)
8. **Singleton pattern**: `@Injectable({ providedIn: 'root' })` ensures single instance across app
9. **Display name caching**: EntityRecordService.getRecordDisplayName() queries both stores to resolve display labels
10. **Backlink queries**: EntityRecordService.getBacklinkedRecords() filters records by reference field types (reference vs reference-list)

---

## Files Involved

- `/src/app/store/entity.store.ts` - Entity schema store
- `/src/app/store/entity-record.store.ts` - Entity record data store
- `/src/app/services/entity.service.ts` - Entity business logic
- `/src/app/services/entity-record.service.ts` - Record CRUD & queries
- `/src/app/models/entity.model.ts` - Entity interface definitions
- `/src/app/models/entity-record.model.ts` - Record interface definitions
- `/src/app/pages/entity-list/entity-list.page.ts` - List view example
- `/src/app/pages/entity-detail/entity-detail.page.ts` - Detail view example
- `/src/app/pages/entity-create/entity-create.page.ts` - Create form example
