# Persist Column Visibility — Implementation Plan

## Overview

The entity-list page and view page both have a "Columns" button that opens a modal allowing users to toggle which columns are visible. Currently the selection resets on every page load. This plan persists the selection to SQLite via the Electron IPC layer.

Column visibility is scoped per context:
- **entity-list** page → keyed by `('entity-list', entityId)`
- **view** page → keyed by `('view', viewId)`

## Storage Format

SQLite table `column_visibility`:

| column        | type | notes                                      |
|---------------|------|--------------------------------------------|
| context_type  | TEXT | `'entity-list'` or `'view'`               |
| context_id    | TEXT | entityId or viewId                         |
| field_ids     | TEXT | JSON array of visible field ID strings     |

Primary key: `(context_type, context_id)` — upsert on save.

## Implementation

### 1. DB migration — `electron/src/db.ts`

Add `CREATE TABLE IF NOT EXISTS column_visibility` inside `runMigrations`.

### 2. Electron service — `electron/src/service/column-visibility.service.ts`

```ts
getColumnVisibility(contextType: string, contextId: string): string[] | null
setColumnVisibility(contextType: string, contextId: string, fieldIds: string[]): void
```

### 3. IPC handlers — `electron/src/ipc-handlers.ts`

```
columnVisibility:get  (contextType, contextId) → string[] | null
columnVisibility:set  (contextType, contextId, fieldIds) → void
```

### 4. Preload — `electron/src/preload.ts`

Expose `columnVisibilityGet` and `columnVisibilitySet`.

### 5. Frontend service — `webapp/src/app/services/column-visibility.service.ts`

```ts
async load(contextType: 'entity-list' | 'view', contextId: string): Promise<Set<string> | null>
async save(contextType: 'entity-list' | 'view', contextId: string, fieldIds: Set<string>): Promise<void>
```

### 6. `entity-list.page.ts`

- Inject `ColumnVisibilityService`
- In `ngOnInit`: `await service.load('entity-list', entity.id)` → use as initial committed set (fall back to all fields)
- In `onCommitColumns`: `await service.save('entity-list', entity.id, selected)`

### 7. `view.page.ts`

- Inject `ColumnVisibilityService`
- In `ngOnInit` (inside route.params): `await service.load('view', viewId)` → use as initial committed set
- Add `onCommitColumns` handler that saves then updates `columnModalState`
- Wire the template's columns modal confirm to `onCommitColumns`

## Files Touched

**New:**
- `electron/src/service/column-visibility.service.ts`
- `webapp/src/app/services/column-visibility.service.ts`

**Modified:**
- `electron/src/db.ts` — migration
- `electron/src/ipc-handlers.ts` — IPC handlers
- `electron/src/preload.ts` — expose API
- `webapp/src/app/pages/entity-list/entity-list.page.ts`
- `webapp/src/app/pages/view/view.page.ts`
