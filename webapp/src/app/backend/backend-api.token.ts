import { InjectionToken } from '@angular/core';

import { Backend } from './backend-api.interface';
import { ElectronBackend } from './electron-backend-api';
import { InMemoryBackend } from './in-memory-backend-api';

export const BACKEND_API = new InjectionToken<Backend>('Backend');

/**
 * Decides which Backend implementation to use based on the runtime environment.
 * Called once during application bootstrap; the returned instance is then shared
 * as a singleton across the lifetime of the app.
 */
export function backendFactory(): Backend {
    if ((window as any).electronApi) {
        // Running inside Electron — use IPC bridge
        return new ElectronBackend();
    }
    // Running standalone in a browser — use in-memory store
    return new InMemoryBackend();
}

export const backendProvider = {
    provide: BACKEND_API,
    useFactory: backendFactory,
};
