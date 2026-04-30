/**
 * Electron main process entry point.
 * Creates the BrowserWindow, loads the pre-built Angular webapp from disk,
 * and registers IPC handlers.
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc-handlers';



/**
 * Create and configure the main application window.
 *
 * @returns The created BrowserWindow instance
 */
function createWindow(): BrowserWindow {
    const browserWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            // Point to the compiled preload script sitting next to main.js in dist/
            preload: path.join(__dirname, 'preload.js'),
            // Disable Node integration in the renderer — all Node access goes
            // through contextBridge in preload.ts instead.
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Load the Angular app from the local filesystem.
    // __dirname at runtime is dist/, so dist/webapp/index.html is the target.
    browserWindow.loadFile(path.join(__dirname, 'webapp', 'index.html'));

    return browserWindow;
}

registerIpcHandlers(ipcMain);

app.whenReady().then(() => {
    createWindow();

    // macOS convention: re-create a window when the dock icon is clicked
    // and no other windows are open.
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // On macOS, apps stay in the menu bar until the user explicitly quits.
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
