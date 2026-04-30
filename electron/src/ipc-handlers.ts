import 'electron';

// Register all IPC handlers before any window is created so they are
// available as soon as the renderer sends its first message.
export function registerIpcHandlers(ipcMain: Electron.IpcMain): void {
    /**
     * Placeholder handler demonstrating the IPC channel pattern.
     * Returns a greeting string to the renderer.
     *
     * @returns A hello-world string
     */
    ipcMain.handle('hello-world', onHelloWorld);
}

async function onHelloWorld(_event: Electron.IpcMainInvokeEvent, name: string): Promise<string> {
    console.log('Received hello-world IPC from', name)
    return `Hello, ${name}! From the main process!`;
}