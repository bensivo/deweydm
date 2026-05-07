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

    // Entity operations
    entityGetAll: (): Promise<any[]> => {
        return ipcRenderer.invoke('entity:getAll');
    },
    entityGetById: (id: string): Promise<any> => {
        return ipcRenderer.invoke('entity:getById', id);
    },
    entityCreate: (name: string, pluralName: string): Promise<any> => {
        return ipcRenderer.invoke('entity:create', name, pluralName);
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
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
