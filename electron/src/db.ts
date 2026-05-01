import * as path from 'path';
import * as sqlite3 from 'sqlite3';

/**
 * Returns the filepath to the SQLite Database, using the 'userData' directory provided by Electron's app module.
 */
export function getDbPath(app: Electron.App): string {
    const dbDir = path.join(app.getPath('userData'), 'db');
    return path.join(dbDir, 'dewey.db');
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


export async function runMigrations(db: sqlite3.Database): Promise<void> {
    const run = (sql: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            db.run(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    };

    await new Promise<void>((resolve, reject) => {
        db.serialize(async () => {
            try {
                // Entity definitions
                await run(`
                    CREATE TABLE IF NOT EXISTS entities (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        plural_name TEXT NOT NULL,
                        display_name_field_id TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Field definitions for each entity
                await run(`
                    CREATE TABLE IF NOT EXISTS entity_fields (
                        id TEXT PRIMARY KEY,
                        entity_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        type TEXT NOT NULL CHECK (type IN ('short-text', 'long-text', 'number', 'reference', 'backlink', 'option', 'reference-list')),
                        reference_entity_id TEXT,
                        backlink_source_entity_id TEXT,
                        backlink_source_field_id TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
                        FOREIGN KEY (reference_entity_id) REFERENCES entities(id),
                        FOREIGN KEY (backlink_source_entity_id) REFERENCES entities(id),
                        UNIQUE(entity_id, id)
                    )
                `);

                // Option values for 'option' type fields
                await run(`
                    CREATE TABLE IF NOT EXISTS entity_field_options (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        field_id TEXT NOT NULL,
                        option_value TEXT NOT NULL,
                        display_order INTEGER,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (field_id) REFERENCES entity_fields(id) ON DELETE CASCADE,
                        UNIQUE(field_id, option_value)
                    )
                `);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    });

    // Placeholder for future migration logic. For now we just return a resolved promise.
    return Promise.resolve();
}