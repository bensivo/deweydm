import 'electron';
import sqlite3 from 'sqlite3';

import { EntityService, FieldType } from './service/entity.service';
import { EntityRecordService } from './service/entity-record.service';
import { WorkspaceService } from './service/workspace.service';
import { ColumnVisibilityService } from './service/column-visibility.service';
import { DocumentService } from './service/document.service';

// Register all IPC handlers before any window is created so they are
// available as soon as the renderer sends its first message.
export function registerIpcHandlers(ipcMain: Electron.IpcMain, db: sqlite3.Database, documentsDir: string): void {
    const entityService = new EntityService(db);
    const entityRecordService = new EntityRecordService(db);
    const workspaceService = new WorkspaceService(db);
    const columnVisibilityService = new ColumnVisibilityService(db);
    const documentService = new DocumentService(db, documentsDir);

    ipcMain.handle('hello-world', onHelloWorld);

    // Workspace handlers
    ipcMain.handle('workspace:getAll', async () => {
        return workspaceService.getAll();
    });

    ipcMain.handle('workspace:create', async (_event: Electron.IpcMainInvokeEvent, name: string) => {
        return workspaceService.create(name);
    });

    ipcMain.handle('workspace:delete', async (_event: Electron.IpcMainInvokeEvent, id: string) => {
        return workspaceService.delete(id);
    });

    ipcMain.handle('workspace:setDefault', async (_event: Electron.IpcMainInvokeEvent, id: string) => {
        return workspaceService.setDefault(id);
    });

    // Entity handlers
    ipcMain.handle('entity:getAll', async (_event: Electron.IpcMainInvokeEvent, workspaceId?: string) => {
        return entityService.getAll(workspaceId);
    });

    ipcMain.handle('entity:getById', async (_event: Electron.IpcMainInvokeEvent, id: string) => {
        return entityService.getById(id);
    });

    ipcMain.handle('entity:create', async (_event: Electron.IpcMainInvokeEvent, name: string, pluralName: string, workspaceId?: string) => {
        return entityService.createEntity(name, pluralName, workspaceId);
    });

    ipcMain.handle('entity:delete', async (_event: Electron.IpcMainInvokeEvent, id: string) => {
        return entityService.deleteEntity(id);
    });

    ipcMain.handle('entity:setDisplayNameField', async (_event: Electron.IpcMainInvokeEvent, entityId: string, fieldId: string) => {
        return entityService.setDisplayNameField(entityId, fieldId);
    });

    ipcMain.handle('entity:addField', async (
        _event: Electron.IpcMainInvokeEvent,
        entityId: string,
        fieldName: string,
        fieldType: FieldType,
        referenceEntityId?: string,
        backlinkSourceEntityId?: string,
        backlinkSourceFieldId?: string,
        optionValues?: string[],
    ) => {
        return entityService.addField(entityId, fieldName, fieldType, referenceEntityId, backlinkSourceEntityId, backlinkSourceFieldId, optionValues);
    });

    ipcMain.handle('entity:removeField', async (_event: Electron.IpcMainInvokeEvent, entityId: string, fieldId: string) => {
        return entityService.removeField(entityId, fieldId);
    });

    ipcMain.handle('entity:reorderFields', async (_event: Electron.IpcMainInvokeEvent, entityId: string, orderedFieldIds: string[]) => {
        return entityService.reorderFields(entityId, orderedFieldIds);
    });

    // Entity record handlers
    ipcMain.handle('entityRecord:getAll', async () => {
        return entityRecordService.getAll();
    });

    ipcMain.handle('entityRecord:getById', async (_event: Electron.IpcMainInvokeEvent, id: string) => {
        return entityRecordService.getById(id);
    });

    ipcMain.handle('entityRecord:getByEntityId', async (_event: Electron.IpcMainInvokeEvent, entityId: string) => {
        return entityRecordService.getByEntityId(entityId);
    });

    ipcMain.handle('entityRecord:create', async (_event: Electron.IpcMainInvokeEvent, entityId: string, data: Record<string, string>) => {
        return entityRecordService.createRecord(entityId, data);
    });

    ipcMain.handle('entityRecord:update', async (_event: Electron.IpcMainInvokeEvent, id: string, data: Record<string, string>) => {
        return entityRecordService.updateRecord(id, data);
    });

    ipcMain.handle('entityRecord:delete', async (_event: Electron.IpcMainInvokeEvent, id: string) => {
        return entityRecordService.deleteRecord(id);
    });

    // Column visibility handlers
    ipcMain.handle('columnVisibility:get', async (_event: Electron.IpcMainInvokeEvent, contextType: string, contextId: string) => {
        return columnVisibilityService.get(contextType, contextId);
    });

    ipcMain.handle('columnVisibility:set', async (_event: Electron.IpcMainInvokeEvent, contextType: string, contextId: string, fieldIds: string[]) => {
        return columnVisibilityService.set(contextType, contextId, fieldIds);
    });

    // Document handlers
    ipcMain.handle('document:getAll', async () => {
        return documentService.getAll();
    });

    ipcMain.handle('document:getById', async (_event: Electron.IpcMainInvokeEvent, id: string) => {
        return documentService.getById(id);
    });

    ipcMain.handle('document:create', async (
        _event: Electron.IpcMainInvokeEvent,
        name: string,
        description: string,
        originalFileName: string,
        mimeType: string,
        fileBuffer: Buffer,
    ) => {
        return documentService.create(name, description, originalFileName, mimeType, fileBuffer);
    });

    ipcMain.handle('document:delete', async (_event: Electron.IpcMainInvokeEvent, id: string) => {
        return documentService.delete(id);
    });

    ipcMain.handle('document:addLink', async (
        _event: Electron.IpcMainInvokeEvent,
        documentId: string,
        entityId: string,
        recordId: string,
    ) => {
        return documentService.addLink(documentId, entityId, recordId);
    });

    ipcMain.handle('document:removeLink', async (
        _event: Electron.IpcMainInvokeEvent,
        documentId: string,
        entityId: string,
        recordId: string,
    ) => {
        return documentService.removeLink(documentId, entityId, recordId);
    });

    ipcMain.handle('document:getFile', async (_event: Electron.IpcMainInvokeEvent, id: string) => {
        const buffer = await documentService.getFileBuffer(id);
        const document = await documentService.getById(id);
        const mimeType = document?.mimeType ?? 'application/octet-stream';
        const base64 = buffer.toString('base64');
        return `data:${mimeType};base64,${base64}`;
    });
}

async function onHelloWorld(_event: Electron.IpcMainInvokeEvent, name: string): Promise<string> {
    console.log('Received hello-world IPC from', name)
    return `Hello, ${name}! From the main process!`;
}
