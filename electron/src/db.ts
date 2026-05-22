import * as path from 'path';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';

import { runMigrations } from './migrations';

export { runMigrations };

/**
 * Returns the filepath to the SQLite Database, using the 'userData' directory provided by Electron's app module.
 */
export function getDbPath(app: Electron.App): string {
    const dbDir = path.join(app.getPath('userData'), 'db');
    return path.join(dbDir, 'dewey.db');
}

/**
 * Returns the directory used to store uploaded document files.
 */
export function getDocumentsDir(app: Electron.App): string {
    return path.join(app.getPath('userData'), 'documents');
}

/**
 * Ensures the documents storage directory exists.
 */
export function ensureDocumentsDir(app: Electron.App): void {
    const dir = getDocumentsDir(app);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export async function initializeDb(app: Electron.App): Promise<sqlite3.Database> {
    const dbPath = getDbPath(app);

    // Ensure the directory exists
    const dbDir = path.dirname(dbPath);
    if (!require('fs').existsSync(dbDir)) {
        console.log(`Creating database directory at ${dbDir}`);
        require('fs').mkdirSync(dbDir, { recursive: true });
    }

    console.log(`Initializing database at ${dbPath}`);
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }

            runMigrations(db)
                .then(() => {
                    console.log('Database initialized and migrations run successfully');
                    resolve(db);
                })
                .catch((migrationErr) => {
                    console.error('Error running migrations:', migrationErr);
                    reject(migrationErr);
                });
        });
    });
}

