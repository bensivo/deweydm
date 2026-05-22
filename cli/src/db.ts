import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as sqlite3 from 'sqlite3';

import { runMigrations } from '../../electron/src/migrations';

/**
 * Resolves the default Dewey DM userData directory in an Electron-equivalent
 * way without importing Electron. Honors the platform conventions Electron
 * uses for `app.getPath('userData')`.
 *
 * The Electron app id used in dev is `Electron`; the packaged build uses
 * `PDMS`. We prefer the path that already exists; if neither does, we fall
 * back to the dev `Electron` location (matching `npm run electron-dev`).
 */
function resolveDefaultUserDataDir(): string {
    const candidates: string[] = [];
    const platform = process.platform;
    if (platform === 'darwin') { // macos
        const base = path.join(os.homedir(), 'Library', 'Application Support');
        candidates.push(path.join(base, 'pdms-electron'));
    } else if (platform === 'win32') { // windows
        const base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
        candidates.push(path.join(base, 'pdms-electron'));
    } else { // linux
        const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
        candidates.push(path.join(base, 'pdms-electron'));
    }

    for (const candidate of candidates) {
        if (fs.existsSync(path.join(candidate, 'db', 'dewey.db'))) {
            return candidate;
        }
    }
    return candidates[0];
}

export function resolveDefaultDbPath(): string {
    if (process.env.DEWEY_DB_PATH) {
        return process.env.DEWEY_DB_PATH;
    }
    return path.join(resolveDefaultUserDataDir(), 'db', 'dewey.db');
}

export function resolveDefaultDocumentsDir(): string {
    if (process.env.DEWEY_DOCUMENTS_DIR) {
        return process.env.DEWEY_DOCUMENTS_DIR;
    }
    return path.join(resolveDefaultUserDataDir(), 'documents');
}

/**
 * Opens (creating if needed) the SQLite DB at `dbPath` and runs migrations.
 * Ensures the parent directory exists.
 */
export async function openDatabase(dbPath: string): Promise<sqlite3.Database> {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = await new Promise<sqlite3.Database>((resolve, reject) => {
        const handle = new sqlite3.Database(dbPath, (err) => {
            if (err) reject(err);
            else resolve(handle);
        });
    });

    await runMigrations(db);
    return db;
}

export function ensureDocumentsDir(documentsDir: string): void {
    if (!fs.existsSync(documentsDir)) {
        fs.mkdirSync(documentsDir, { recursive: true });
    }
}
