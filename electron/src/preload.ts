/**
 * Preload script: runs in a Node.js context before the renderer loads, with
 * access to both Node APIs and the DOM. Uses contextBridge to safely expose
 * a typed API surface to the renderer without enabling full nodeIntegration.
 */
import { contextBridge, ipcRenderer } from 'electron';

/**
 * The API object exposed on window.electronApi in the renderer.
 * Add new IPC-backed methods here as the app grows.
 */
const electronApi = {
    /**
     * Sends a hello-world IPC message to the main process and returns the response.
     *
     * @returns A promise resolving to the greeting string from main
     */
    helloWorld: (name: string): Promise<string> => {
        return ipcRenderer.invoke('hello-world', name);
    },

    // Workspace operations
    workspaceGetAll: (): Promise<any[]> => {
        return ipcRenderer.invoke('workspace:getAll');
    },
    workspaceCreate: (name: string): Promise<any> => {
        return ipcRenderer.invoke('workspace:create', name);
    },
    workspaceDelete: (id: string): Promise<void> => {
        return ipcRenderer.invoke('workspace:delete', id);
    },
    workspaceSetDefault: (id: string): Promise<void> => {
        return ipcRenderer.invoke('workspace:setDefault', id);
    },

    // Entity operations
    entityGetAll: (workspaceId?: string): Promise<any[]> => {
        return ipcRenderer.invoke('entity:getAll', workspaceId);
    },
    entityGetById: (id: string): Promise<any> => {
        return ipcRenderer.invoke('entity:getById', id);
    },
    entityCreate: (name: string, pluralName: string, workspaceId?: string): Promise<any> => {
        return ipcRenderer.invoke('entity:create', name, pluralName, workspaceId);
    },
    entityDelete: (id: string): Promise<void> => {
        return ipcRenderer.invoke('entity:delete', id);
    },
    entitySetDisplayNameField: (entityId: string, fieldId: string): Promise<void> => {
        return ipcRenderer.invoke('entity:setDisplayNameField', entityId, fieldId);
    },
    entityAddField: (
        entityId: string,
        fieldName: string,
        fieldType: string,
        referenceEntityId?: string,
        backlinkSourceEntityId?: string,
        backlinkSourceFieldId?: string,
        optionValues?: string[],
    ): Promise<any> => {
        return ipcRenderer.invoke('entity:addField', entityId, fieldName, fieldType, referenceEntityId, backlinkSourceEntityId, backlinkSourceFieldId, optionValues);
    },
    entityRemoveField: (entityId: string, fieldId: string): Promise<void> => {
        return ipcRenderer.invoke('entity:removeField', entityId, fieldId);
    },
    entityReorderFields: (entityId: string, orderedFieldIds: string[]): Promise<void> => {
        return ipcRenderer.invoke('entity:reorderFields', entityId, orderedFieldIds);
    },

    // Entity record operations
    entityRecordGetAll: (): Promise<any[]> => {
        return ipcRenderer.invoke('entityRecord:getAll');
    },
    entityRecordGetById: (id: string): Promise<any> => {
        return ipcRenderer.invoke('entityRecord:getById', id);
    },
    entityRecordGetByEntityId: (entityId: string): Promise<any[]> => {
        return ipcRenderer.invoke('entityRecord:getByEntityId', entityId);
    },
    entityRecordCreate: (entityId: string, data: Record<string, string>): Promise<any> => {
        return ipcRenderer.invoke('entityRecord:create', entityId, data);
    },
    entityRecordUpdate: (id: string, data: Record<string, string>): Promise<void> => {
        return ipcRenderer.invoke('entityRecord:update', id, data);
    },
    entityRecordDelete: (id: string): Promise<void> => {
        return ipcRenderer.invoke('entityRecord:delete', id);
    },

    // Column visibility operations
    columnVisibilityGet: (contextType: string, contextId: string): Promise<string[] | null> => {
        return ipcRenderer.invoke('columnVisibility:get', contextType, contextId);
    },
    columnVisibilitySet: (contextType: string, contextId: string, fieldIds: string[]): Promise<void> => {
        return ipcRenderer.invoke('columnVisibility:set', contextType, contextId, fieldIds);
    },

    // Document operations
    documentGetAll: (workspaceId?: string): Promise<any[]> => {
        return ipcRenderer.invoke('document:getAll', workspaceId);
    },
    documentGetById: (id: string): Promise<any> => {
        return ipcRenderer.invoke('document:getById', id);
    },
    documentCreate: (
        name: string,
        description: string,
        originalFileName: string,
        mimeType: string,
        fileBuffer: ArrayBuffer,
        workspaceId?: string,
    ): Promise<any> => {
        return ipcRenderer.invoke('document:create', name, description, originalFileName, mimeType, Buffer.from(fileBuffer), workspaceId);
    },
    documentDelete: (id: string): Promise<void> => {
        return ipcRenderer.invoke('document:delete', id);
    },
    documentUpdate: (id: string, fields: { name?: string; description?: string }): Promise<void> => {
        return ipcRenderer.invoke('document:update', id, fields);
    },
    documentAddLink: (documentId: string, entityId: string, recordId: string): Promise<void> => {
        return ipcRenderer.invoke('document:addLink', documentId, entityId, recordId);
    },
    documentRemoveLink: (documentId: string, entityId: string, recordId: string): Promise<void> => {
        return ipcRenderer.invoke('document:removeLink', documentId, entityId, recordId);
    },
    documentGetFile: (id: string): Promise<string> => {
        return ipcRenderer.invoke('document:getFile', id);
    },

    // Note operations
    noteGetAll: (workspaceId?: string): Promise<any[]> => {
        return ipcRenderer.invoke('note:getAll', workspaceId);
    },
    noteGetById: (id: string): Promise<any> => {
        return ipcRenderer.invoke('note:getById', id);
    },
    noteCreate: (
        name: string,
        description: string,
        contentJson: string,
        contentText: string,
        workspaceId?: string,
    ): Promise<any> => {
        return ipcRenderer.invoke('note:create', name, description, contentJson, contentText, workspaceId);
    },
    noteUpdate: (
        id: string,
        fields: { name?: string; description?: string; contentJson?: string; contentText?: string },
    ): Promise<void> => {
        return ipcRenderer.invoke('note:update', id, fields);
    },
    noteDelete: (id: string): Promise<void> => {
        return ipcRenderer.invoke('note:delete', id);
    },
    noteAddLink: (noteId: string, entityId: string, recordId: string): Promise<void> => {
        return ipcRenderer.invoke('note:addLink', noteId, entityId, recordId);
    },
    noteRemoveLink: (noteId: string, entityId: string, recordId: string): Promise<void> => {
        return ipcRenderer.invoke('note:removeLink', noteId, entityId, recordId);
    },

    // View operations
    viewGetAll: (workspaceId?: string): Promise<any[]> => {
        return ipcRenderer.invoke('view:getAll', workspaceId);
    },
    viewCreate: (id: string, name: string, entityId: string, filters: any[], orderBy: any[], workspaceId?: string): Promise<any> => {
        return ipcRenderer.invoke('view:create', id, name, entityId, filters, orderBy, workspaceId);
    },
    viewDelete: (id: string): Promise<void> => {
        return ipcRenderer.invoke('view:delete', id);
    },
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
