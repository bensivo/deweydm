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
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
