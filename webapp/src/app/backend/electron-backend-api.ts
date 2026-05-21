import { Backend } from './backend-api.interface';
import { Entity, EntityField, FieldType } from '../models/entity.model';
import { EntityRecord } from '../models/entity-record.model';
import { Workspace } from '../models/workspace.model';
import { Document } from '../models/document.model';
import { Note } from '../models/note.model';
import { View } from '../models/view.model';
import { Filter } from '../models/filter.model';
import { OrderBy } from '../models/order-by.model';

/**
 * Backend implementation that delegates 1-to-1 to the Electron preload IPC bridge
 * exposed on `window.electronApi`. Used whenever the app is running inside Electron.
 */
export class ElectronBackend implements Backend {
    private get api(): any {
        return (window as any).electronApi;
    }

    workspaceGetAll(): Promise<Workspace[]> {
        return this.api.workspaceGetAll();
    }
    workspaceCreate(name: string): Promise<Workspace> {
        return this.api.workspaceCreate(name);
    }
    workspaceDelete(id: string): Promise<void> {
        return this.api.workspaceDelete(id);
    }
    workspaceSetDefault(id: string): Promise<void> {
        return this.api.workspaceSetDefault(id);
    }

    entityGetAll(workspaceId?: string): Promise<Entity[]> {
        return this.api.entityGetAll(workspaceId);
    }
    entityGetById(id: string): Promise<Entity | null> {
        return this.api.entityGetById(id);
    }
    entityCreate(name: string, pluralName: string, workspaceId?: string): Promise<Entity> {
        return this.api.entityCreate(name, pluralName, workspaceId);
    }
    entityDelete(id: string): Promise<void> {
        return this.api.entityDelete(id);
    }
    entitySetDisplayNameField(entityId: string, fieldId: string): Promise<void> {
        return this.api.entitySetDisplayNameField(entityId, fieldId);
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
        return this.api.entityAddField(
            entityId,
            fieldName,
            fieldType,
            referenceEntityId,
            backlinkSourceEntityId,
            backlinkSourceFieldId,
            optionValues,
        );
    }
    entityRemoveField(entityId: string, fieldId: string): Promise<void> {
        return this.api.entityRemoveField(entityId, fieldId);
    }
    entityReorderFields(entityId: string, orderedFieldIds: string[]): Promise<void> {
        return this.api.entityReorderFields(entityId, orderedFieldIds);
    }

    entityRecordGetAll(): Promise<EntityRecord[]> {
        return this.api.entityRecordGetAll();
    }
    entityRecordGetById(id: string): Promise<EntityRecord | null> {
        return this.api.entityRecordGetById(id);
    }
    entityRecordGetByEntityId(entityId: string): Promise<EntityRecord[]> {
        return this.api.entityRecordGetByEntityId(entityId);
    }
    entityRecordCreate(entityId: string, data: Record<string, string>): Promise<EntityRecord> {
        return this.api.entityRecordCreate(entityId, data);
    }
    entityRecordUpdate(id: string, data: Record<string, string>): Promise<void> {
        return this.api.entityRecordUpdate(id, data);
    }
    entityRecordDelete(id: string): Promise<void> {
        return this.api.entityRecordDelete(id);
    }

    columnVisibilityGet(contextType: string, contextId: string): Promise<string[] | null> {
        return this.api.columnVisibilityGet(contextType, contextId);
    }
    columnVisibilitySet(contextType: string, contextId: string, fieldIds: string[]): Promise<void> {
        return this.api.columnVisibilitySet(contextType, contextId, fieldIds);
    }

    documentGetAll(workspaceId?: string): Promise<Document[]> {
        return this.api.documentGetAll(workspaceId);
    }
    documentGetById(id: string): Promise<Document | null> {
        return this.api.documentGetById(id);
    }
    documentCreate(
        name: string,
        description: string,
        originalFileName: string,
        mimeType: string,
        fileBuffer: ArrayBuffer,
        workspaceId?: string,
    ): Promise<Document> {
        return this.api.documentCreate(name, description, originalFileName, mimeType, fileBuffer, workspaceId);
    }
    documentDelete(id: string): Promise<void> {
        return this.api.documentDelete(id);
    }
    documentUpdate(id: string, fields: { name?: string; description?: string }): Promise<void> {
        return this.api.documentUpdate(id, fields);
    }
    documentAddLink(documentId: string, entityId: string, recordId: string): Promise<void> {
        return this.api.documentAddLink(documentId, entityId, recordId);
    }
    documentRemoveLink(documentId: string, entityId: string, recordId: string): Promise<void> {
        return this.api.documentRemoveLink(documentId, entityId, recordId);
    }
    documentGetFile(id: string): Promise<string> {
        return this.api.documentGetFile(id);
    }

    noteGetAll(workspaceId?: string): Promise<Note[]> {
        return this.api.noteGetAll(workspaceId);
    }
    noteGetById(id: string): Promise<Note | null> {
        return this.api.noteGetById(id);
    }
    noteCreate(
        name: string,
        description: string,
        contentJson: string,
        contentText: string,
        workspaceId?: string,
    ): Promise<Note> {
        return this.api.noteCreate(name, description, contentJson, contentText, workspaceId);
    }
    noteUpdate(
        id: string,
        fields: { name?: string; description?: string; contentJson?: string; contentText?: string },
    ): Promise<void> {
        return this.api.noteUpdate(id, fields);
    }
    noteDelete(id: string): Promise<void> {
        return this.api.noteDelete(id);
    }
    noteAddLink(noteId: string, entityId: string, recordId: string): Promise<void> {
        return this.api.noteAddLink(noteId, entityId, recordId);
    }
    noteRemoveLink(noteId: string, entityId: string, recordId: string): Promise<void> {
        return this.api.noteRemoveLink(noteId, entityId, recordId);
    }

    viewGetAll(workspaceId?: string): Promise<View[]> {
        return this.api.viewGetAll(workspaceId);
    }
    viewCreate(
        id: string,
        name: string,
        entityId: string,
        filters: Filter[],
        orderBy: OrderBy[],
        workspaceId?: string,
    ): Promise<View> {
        return this.api.viewCreate(id, name, entityId, filters, orderBy, workspaceId);
    }
    viewDelete(id: string): Promise<void> {
        return this.api.viewDelete(id);
    }
}
