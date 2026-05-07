import 'electron';
import sqlite3 from 'sqlite3';

import { EntityService, FieldType } from './service/entity.service';
import { EntityRecordService } from './service/entity-record.service';

// Register all IPC handlers before any window is created so they are
// available as soon as the renderer sends its first message.
export function registerIpcHandlers(ipcMain: Electron.IpcMain, db: sqlite3.Database): void {
    const entityService = new EntityService(db);
    const entityRecordService = new EntityRecordService(db);

    ipcMain.handle('hello-world', onHelloWorld);

    // Entity handlers
    ipcMain.handle('entity:getAll', async () => {
        return entityService.getAll();
    });

    ipcMain.handle('entity:getById', async (_event: Electron.IpcMainInvokeEvent, id: string) => {
        return entityService.getById(id);
    });

    ipcMain.handle('entity:create', async (_event: Electron.IpcMainInvokeEvent, name: string, pluralName: string) => {
        return entityService.createEntity(name, pluralName);
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
}

async function onHelloWorld(_event: Electron.IpcMainInvokeEvent, name: string): Promise<string> {
    console.log('Received hello-world IPC from', name)
    return `Hello, ${name}! From the main process!`;
}
