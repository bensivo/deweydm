import { Entity, EntityField, FieldType } from '../models/entity.model';
import { EntityRecord } from '../models/entity-record.model';
import { Workspace } from '../models/workspace.model';
import { Document } from '../models/document.model';
import { View } from '../models/view.model';
import { Filter } from '../models/filter.model';
import { OrderBy } from '../models/order-by.model';

/**
 * Contract describing every backend operation the webapp needs.
 *
 * Implementations include:
 *  - ElectronBackend: bridges to the Electron preload IPC layer
 *  - InMemoryBackend: keeps all data in JS Maps (for standalone browser use)
 *  - (future) RestBackend: forwards to a remote HTTP server
 */
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

    // Views
    viewGetAll(): Promise<View[]>;
    viewCreate(
        id: string,
        name: string,
        entityId: string,
        filters: Filter[],
        orderBy: OrderBy[],
    ): Promise<View>;
    viewDelete(id: string): Promise<void>;
}
