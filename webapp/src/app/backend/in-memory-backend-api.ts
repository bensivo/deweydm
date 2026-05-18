import { Backend } from './backend-api.interface';
import { Entity, EntityField, FieldType } from '../models/entity.model';
import { EntityRecord } from '../models/entity-record.model';
import { Workspace } from '../models/workspace.model';
import { Document, DocumentLink } from '../models/document.model';
import { View } from '../models/view.model';
import { Filter } from '../models/filter.model';

/**
 * Backend implementation that stores everything in in-process JavaScript Maps.
 *
 * Used when the app runs standalone in a browser (no Electron shell). State is lost
 * on page reload — this is intentional, the in-memory backend is for previewing the
 * UI without any persistent storage.
 */
export class InMemoryBackend implements Backend {
    private workspaces: Map<string, Workspace> = new Map();
    private entities: Map<string, Entity> = new Map();
    private records: Map<string, EntityRecord> = new Map();
    private columnVisibility: Map<string, string[]> = new Map();
    private documents: Map<string, Document> = new Map();
    private documentFiles: Map<string, string> = new Map();
    private views: Map<string, View> = new Map();

    constructor() {
        console.log('[InMemoryBackend] constructor');
        // Seed a default workspace so the app has something to show on first load
        const defaultWorkspace: Workspace = {
            id: crypto.randomUUID(),
            name: 'Default',
            isDefault: true,
            createdAt: new Date().toISOString(),
        };
        this.workspaces.set(defaultWorkspace.id, defaultWorkspace);
    }

    // Workspaces

    workspaceGetAll(): Promise<Workspace[]> {
        console.log('[InMemoryBackend] workspaceGetAll');
        return Promise.resolve(Array.from(this.workspaces.values()));
    }

    workspaceCreate(name: string): Promise<Workspace> {
        console.log('[InMemoryBackend] workspaceCreate', { name });
        const workspace: Workspace = {
            id: crypto.randomUUID(),
            name,
            isDefault: false,
            createdAt: new Date().toISOString(),
        };
        this.workspaces.set(workspace.id, workspace);
        return Promise.resolve(workspace);
    }

    workspaceDelete(id: string): Promise<void> {
        console.log('[InMemoryBackend] workspaceDelete', { id });
        this.workspaces.delete(id);
        return Promise.resolve();
    }

    workspaceSetDefault(id: string): Promise<void> {
        console.log('[InMemoryBackend] workspaceSetDefault', { id });
        for (const ws of this.workspaces.values()) {
            ws.isDefault = ws.id === id;
        }
        return Promise.resolve();
    }

    // Entities

    entityGetAll(_workspaceId?: string): Promise<Entity[]> {
        console.log('[InMemoryBackend] entityGetAll', { workspaceId: _workspaceId });
        // The in-memory backend does not yet scope entities by workspace
        return Promise.resolve(Array.from(this.entities.values()));
    }

    entityGetById(id: string): Promise<Entity | null> {
        console.log('[InMemoryBackend] entityGetById', { id });
        return Promise.resolve(this.entities.get(id) ?? null);
    }

    entityCreate(name: string, pluralName: string, _workspaceId?: string): Promise<Entity> {
        console.log('[InMemoryBackend] entityCreate', { name, pluralName, workspaceId: _workspaceId });
        const entity: Entity = {
            id: crypto.randomUUID(),
            name,
            pluralName,
            fields: [],
        };
        this.entities.set(entity.id, entity);
        return Promise.resolve(entity);
    }

    entityDelete(id: string): Promise<void> {
        console.log('[InMemoryBackend] entityDelete', { id });
        this.entities.delete(id);
        return Promise.resolve();
    }

    entitySetDisplayNameField(entityId: string, fieldId: string): Promise<void> {
        console.log('[InMemoryBackend] entitySetDisplayNameField', { entityId, fieldId });
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.displayNameFieldId = fieldId;
        }
        return Promise.resolve();
    }

    entityAddField(
        entityId: string,
        fieldName: string,
        fieldType: FieldType,
        referenceEntityId?: string,
        backlinkSourceEntityId?: string,
        backlinkSourceFieldId?: string,
        optionValues?: string[],
    ): Promise<EntityField> {
        console.log('[InMemoryBackend] entityAddField', {
            entityId, fieldName, fieldType, referenceEntityId,
            backlinkSourceEntityId, backlinkSourceFieldId, optionValues,
        });
        const entity = this.entities.get(entityId);
        if (!entity) {
            return Promise.reject(new Error(`Entity not found: ${entityId}`));
        }

        const field: EntityField = {
            id: crypto.randomUUID(),
            name: fieldName,
            type: fieldType,
            referenceEntityId,
            backlinkSourceEntityId,
            backlinkSourceFieldId,
            optionValues,
        };
        entity.fields.push(field);
        return Promise.resolve(field);
    }

    entityRemoveField(entityId: string, fieldId: string): Promise<void> {
        console.log('[InMemoryBackend] entityRemoveField', { entityId, fieldId });
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.fields = entity.fields.filter(f => f.id !== fieldId);
        }
        return Promise.resolve();
    }

    entityReorderFields(entityId: string, orderedFieldIds: string[]): Promise<void> {
        console.log('[InMemoryBackend] entityReorderFields', { entityId, orderedFieldIds });
        const entity = this.entities.get(entityId);
        if (!entity) return Promise.resolve();

        const byId = new Map(entity.fields.map(f => [f.id, f]));
        entity.fields = orderedFieldIds
            .map(id => byId.get(id))
            .filter((f): f is EntityField => !!f);
        return Promise.resolve();
    }

    // Entity Records

    entityRecordGetAll(): Promise<EntityRecord[]> {
        console.log('[InMemoryBackend] entityRecordGetAll');
        return Promise.resolve(Array.from(this.records.values()));
    }

    entityRecordGetById(id: string): Promise<EntityRecord | null> {
        console.log('[InMemoryBackend] entityRecordGetById', { id });
        return Promise.resolve(this.records.get(id) ?? null);
    }

    entityRecordGetByEntityId(entityId: string): Promise<EntityRecord[]> {
        console.log('[InMemoryBackend] entityRecordGetByEntityId', { entityId });
        return Promise.resolve(
            Array.from(this.records.values()).filter(r => r.entityId === entityId),
        );
    }

    entityRecordCreate(entityId: string, data: Record<string, string>): Promise<EntityRecord> {
        console.log('[InMemoryBackend] entityRecordCreate', { entityId, data });
        const record: EntityRecord = {
            id: crypto.randomUUID(),
            entityId,
            data: { ...data },
        };
        this.records.set(record.id, record);
        return Promise.resolve(record);
    }

    entityRecordUpdate(id: string, data: Record<string, string>): Promise<void> {
        console.log('[InMemoryBackend] entityRecordUpdate', { id, data });
        const record = this.records.get(id);
        if (record) {
            record.data = { ...data };
        }
        return Promise.resolve();
    }

    entityRecordDelete(id: string): Promise<void> {
        console.log('[InMemoryBackend] entityRecordDelete', { id });
        this.records.delete(id);
        return Promise.resolve();
    }

    // Column Visibility

    private columnVisibilityKey(contextType: string, contextId: string): string {
        return `${contextType}:${contextId}`;
    }

    columnVisibilityGet(contextType: string, contextId: string): Promise<string[] | null> {
        console.log('[InMemoryBackend] columnVisibilityGet', { contextType, contextId });
        const key = this.columnVisibilityKey(contextType, contextId);
        return Promise.resolve(this.columnVisibility.get(key) ?? null);
    }

    columnVisibilitySet(contextType: string, contextId: string, fieldIds: string[]): Promise<void> {
        console.log('[InMemoryBackend] columnVisibilitySet', { contextType, contextId, fieldIds });
        const key = this.columnVisibilityKey(contextType, contextId);
        this.columnVisibility.set(key, [...fieldIds]);
        return Promise.resolve();
    }

    // Documents

    documentGetAll(): Promise<Document[]> {
        console.log('[InMemoryBackend] documentGetAll');
        return Promise.resolve(Array.from(this.documents.values()));
    }

    documentGetById(id: string): Promise<Document | null> {
        console.log('[InMemoryBackend] documentGetById', { id });
        return Promise.resolve(this.documents.get(id) ?? null);
    }

    documentCreate(
        name: string,
        description: string,
        originalFileName: string,
        mimeType: string,
        fileBuffer: ArrayBuffer,
    ): Promise<Document> {
        console.log('[InMemoryBackend] documentCreate', {
            name, description, originalFileName, mimeType, fileSize: fileBuffer.byteLength,
        });
        const doc: Document = {
            id: crypto.randomUUID(),
            name,
            description,
            originalFileName,
            mimeType,
            createdAt: new Date().toISOString(),
            linkedRecords: [],
        };
        this.documents.set(doc.id, doc);

        // Convert ArrayBuffer to base64 data URL
        const bytes = new Uint8Array(fileBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const dataUrl = `data:${mimeType};base64,${base64}`;
        this.documentFiles.set(doc.id, dataUrl);

        return Promise.resolve(doc);
    }

    documentDelete(id: string): Promise<void> {
        console.log('[InMemoryBackend] documentDelete', { id });
        this.documents.delete(id);
        this.documentFiles.delete(id);
        return Promise.resolve();
    }

    documentUpdate(id: string, fields: { name?: string; description?: string }): Promise<void> {
        console.log('[InMemoryBackend] documentUpdate', { id, fields });
        const doc = this.documents.get(id);
        if (doc) {
            if (fields.name !== undefined) doc.name = fields.name;
            if (fields.description !== undefined) doc.description = fields.description;
        }
        return Promise.resolve();
    }

    documentAddLink(documentId: string, entityId: string, recordId: string): Promise<void> {
        console.log('[InMemoryBackend] documentAddLink', { documentId, entityId, recordId });
        const doc = this.documents.get(documentId);
        if (doc) {
            const exists = doc.linkedRecords.some(
                l => l.entityId === entityId && l.recordId === recordId,
            );
            if (!exists) {
                const link: DocumentLink = { entityId, recordId };
                doc.linkedRecords = [...doc.linkedRecords, link];
            }
        }
        return Promise.resolve();
    }

    documentRemoveLink(documentId: string, entityId: string, recordId: string): Promise<void> {
        console.log('[InMemoryBackend] documentRemoveLink', { documentId, entityId, recordId });
        const doc = this.documents.get(documentId);
        if (doc) {
            doc.linkedRecords = doc.linkedRecords.filter(
                l => !(l.entityId === entityId && l.recordId === recordId),
            );
        }
        return Promise.resolve();
    }

    documentGetFile(id: string): Promise<string> {
        console.log('[InMemoryBackend] documentGetFile', { id });
        return Promise.resolve(this.documentFiles.get(id) ?? '');
    }

    // Views

    viewGetAll(): Promise<View[]> {
        console.log('[InMemoryBackend] viewGetAll');
        return Promise.resolve(Array.from(this.views.values()));
    }

    viewCreate(id: string, name: string, entityId: string, filters: Filter[]): Promise<View> {
        console.log('[InMemoryBackend] viewCreate', { id, name, entityId, filters });
        const view: View = { id, name, entityId, filters: filters.map(f => ({ ...f })) };
        this.views.set(id, view);
        return Promise.resolve(view);
    }

    viewDelete(id: string): Promise<void> {
        console.log('[InMemoryBackend] viewDelete', { id });
        this.views.delete(id);
        return Promise.resolve();
    }
}
