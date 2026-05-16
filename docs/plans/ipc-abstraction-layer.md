# IPC Abstraction Layer Plan

## Summary

Add a backend abstraction layer to the webapp so it can run fully without the Electron backend.
Today, every webapp service calls `(window as any).electronApi.*` directly. This plan introduces
a typed `Backend` interface, an `ElectronBackend` implementation that wraps the existing
IPC calls, and an `InMemoryBackend` implementation that stores everything in JavaScript Maps.
On startup the app detects whether `window.electronApi` is present and selects the right
implementation. This same interface point is where a future REST implementation would plug in.

---

## Motivation

- The webapp currently cannot run at all without the Electron shell (all service calls would throw).
- There is no single contract describing what the backend must provide — the shape is implied
  by scattered `(window as any).electronApi.*` call sites.
- A future cloud-hosted / REST version of the app needs a clear seam to implement against.

---

## New Files

### `webapp/src/app/backend/backend-api.interface.ts`

Defines the `Backend` TypeScript interface. Every method mirrors one entry in `preload.ts`'s
`electronApi` object. Use the same names and exact signatures. All methods return `Promise<T>`.

```ts
import { Entity, EntityField, FieldType } from '../models/entity.model';
import { EntityRecord } from '../models/entity-record.model';
import { Workspace } from '../models/workspace.model';
import { Document } from '../models/document.model';

export interface Backend {
    // Workspaces
    workspaceGetAll(): Promise<Workspace[]>;
    workspaceCreate(name: string): Promise<Workspace>;
    workspaceDelete(id: string): Promise<void>;
    workspaceSetDefault(id: string): Promise<void>;

    // Entities
    entityGetAll(workspaceId?: string): Promise<Entity[]>;
    entityGetById(id: string): Promise<Entity | null>;
    entityCreate(name: string, pluralName: string, workspaceId?: string): Promise<Entity>;
    entityDelete(id: string): Promise<void>;
    entitySetDisplayNameField(entityId: string, fieldId: string): Promise<void>;
    entityAddField(
        entityId: string,
        fieldName: string,
        fieldType: FieldType,
        referenceEntityId?: string,
        backlinkSourceEntityId?: string,
        backlinkSourceFieldId?: string,
        optionValues?: string[],
    ): Promise<EntityField>;
    entityRemoveField(entityId: string, fieldId: string): Promise<void>;
    entityReorderFields(entityId: string, orderedFieldIds: string[]): Promise<void>;

    // Entity Records
    entityRecordGetAll(): Promise<EntityRecord[]>;
    entityRecordGetById(id: string): Promise<EntityRecord | null>;
    entityRecordGetByEntityId(entityId: string): Promise<EntityRecord[]>;
    entityRecordCreate(entityId: string, data: Record<string, string>): Promise<EntityRecord>;
    entityRecordUpdate(id: string, data: Record<string, string>): Promise<void>;
    entityRecordDelete(id: string): Promise<void>;

    // Column Visibility
    columnVisibilityGet(contextType: string, contextId: string): Promise<string[] | null>;
    columnVisibilitySet(contextType: string, contextId: string, fieldIds: string[]): Promise<void>;

    // Documents
    documentGetAll(): Promise<Document[]>;
    documentGetById(id: string): Promise<Document | null>;
    documentCreate(
        name: string,
        description: string,
        originalFileName: string,
        mimeType: string,
        fileBuffer: ArrayBuffer,
    ): Promise<Document>;
    documentDelete(id: string): Promise<void>;
    documentUpdate(id: string, fields: { name?: string; description?: string }): Promise<void>;
    documentAddLink(documentId: string, entityId: string, recordId: string): Promise<void>;
    documentRemoveLink(documentId: string, entityId: string, recordId: string): Promise<void>;
    documentGetFile(id: string): Promise<string>;
}
```

---

### `webapp/src/app/backend/electron-backend-api.ts`

`ElectronBackend implements Backend`. Each method delegates to
`(window as any).electronApi.<methodName>(...)` — a 1-to-1 wrapping with no extra logic.

This class is not an Angular injectable; it is instantiated once inside the factory below.

---

### `webapp/src/app/backend/in-memory-backend-api.ts`

`InMemoryBackend implements Backend`. Stores all state in plain Maps.

Key implementation notes:

- **IDs**: generate with `crypto.randomUUID()`.
- **Workspaces**: one default workspace named `'Default'` is seeded on construction with
  `isDefault: true`. `workspaceSetDefault` flips the flag across all workspaces.
- **Entities / Fields**: stored as a `Map<string, Entity>`. `entityAddField` appends to
  `entity.fields`; `entityReorderFields` replaces the array. `entitySetDisplayNameField` updates
  `entity.displayNameFieldId`.
- **EntityRecords**: stored as a `Map<string, EntityRecord>`. `entityRecordGetByEntityId` filters
  by `entityId`.
- **ColumnVisibility**: stored as a `Map<\`${contextType}:${contextId}\`, string[]>`.
- **Documents**: stored as a `Map<string, Document>` for metadata and a
  `Map<string, string>` for base64 data-URLs. `documentCreate` converts `ArrayBuffer` to a
  base64 data-URL via `btoa`. `documentGetFile` returns from the second map.
- All methods return resolved promises (`Promise.resolve(...)`).

---

### `webapp/src/app/backend/backend-api.token.ts`

Defines the Angular injection token and factory provider:

```ts
import { InjectionToken } from '@angular/core';
import { Backend } from './backend-api.interface';

export const BACKEND_API = new InjectionToken<Backend>('Backend');

export function backendFactory(): Backend {
    if ((window as any).electronApi) {
        // Running inside Electron — use IPC bridge
        return new ElectronBackend();
    }
    // Running standalone in a browser — use in-memory store
    return new InMemoryBackend();
}

export const backendProvider = {
    provide: BACKEND_API,
    useFactory: backendFactory,
};
```

The factory is called once at bootstrap and the result is a singleton for the lifetime of the app.

---

## Modified Files

### `webapp/src/app/app.config.ts`

Add `backendProvider` to the `providers` array.

---

### `webapp/src/app/services/entity.service.ts`
### `webapp/src/app/services/entity-record.service.ts`
### `webapp/src/app/services/workspace.service.ts`
### `webapp/src/app/services/document.service.ts`
### `webapp/src/app/services/column-visibility.service.ts`

In each service:

1. Inject `BACKEND_API`:
   ```ts
   constructor(@Inject(BACKEND_API) private backend: Backend, ...) {}
   ```
2. Replace every `(window as any).electronApi.<method>(...)` call with
   `this.backend.<method>(...)`.

No other logic changes in the services — the abstraction lives entirely in the backend layer.

---

## File / Folder Layout After Changes

```
webapp/src/app/
├── backend/
│   ├── backend-api.interface.ts      (new)
│   ├── backend-api.token.ts          (new)
│   ├── electron-backend-api.ts       (new)
│   └── in-memory-backend-api.ts      (new)
├── services/
│   ├── entity.service.ts             (modified)
│   ├── entity-record.service.ts      (modified)
│   ├── workspace.service.ts          (modified)
│   ├── document.service.ts           (modified)
│   └── column-visibility.service.ts  (modified)
└── app.config.ts                     (modified)
```

---

## Extension Point for a Future REST Backend

To add a cloud/REST backend later:

1. Create `webapp/src/app/backend/rest-backend-api.ts` implementing `Backend`.
2. Each method calls the appropriate HTTP endpoint via Angular's `HttpClient`.
3. Update `backendFactory()` to detect the environment (e.g. check for a config flag or
   the absence of `window.electronApi`) and return a `RestBackend` instance.

No changes to services or stores are needed — they already program to the `Backend` interface.

---

## Implementation Order

1. Create `backend-api.interface.ts` — define the contract first.
2. Create `electron-backend-api.ts` — thin wrapper, low risk.
3. Create `in-memory-backend-api.ts` — implement domain logic with Maps.
4. Create `backend-api.token.ts` — factory + token.
5. Update `app.config.ts` — register provider.
6. Update the five services — replace `(window as any).electronApi` with `this.backend`.
7. Verify the app still runs inside Electron (uses ElectronBackend).
8. Verify the app runs standalone in a browser with `ng serve` (uses InMemoryBackend).
