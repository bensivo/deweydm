import * as sqlite3 from 'sqlite3';

/**
 * Runs schema creation and defensive ALTER-based migrations against the given SQLite DB.
 * Safe to call repeatedly; uses IF NOT EXISTS / PRAGMA checks throughout.
 */
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
                await run(`
                    CREATE TABLE IF NOT EXISTS workspaces (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        is_default INTEGER NOT NULL DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                await run(`
                    CREATE TABLE IF NOT EXISTS entities (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        plural_name TEXT NOT NULL,
                        display_name_field_id TEXT,
                        workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                await run(`
                    CREATE TABLE IF NOT EXISTS entity_fields (
                        id TEXT PRIMARY KEY,
                        entity_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        type TEXT NOT NULL CHECK (type IN ('short-text', 'long-text', 'number', 'reference', 'backlink', 'option', 'reference-list')),
                        reference_entity_id TEXT,
                        backlink_source_entity_id TEXT,
                        backlink_source_field_id TEXT,
                        display_order INTEGER,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
                        FOREIGN KEY (reference_entity_id) REFERENCES entities(id),
                        FOREIGN KEY (backlink_source_entity_id) REFERENCES entities(id),
                        UNIQUE(entity_id, id)
                    )
                `);

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

                await run(`
                    CREATE TABLE IF NOT EXISTS entity_records (
                        id TEXT PRIMARY KEY,
                        entity_id TEXT NOT NULL,
                        data TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
                    )
                `);

                await run(`
                    CREATE INDEX IF NOT EXISTS idx_entity_records_entity_id ON entity_records(entity_id)
                `);

                await run(`
                    CREATE TABLE IF NOT EXISTS column_visibility (
                        context_type TEXT NOT NULL,
                        context_id TEXT NOT NULL,
                        field_ids TEXT NOT NULL,
                        PRIMARY KEY (context_type, context_id)
                    )
                `);

                await run(`
                    CREATE TABLE IF NOT EXISTS documents (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT NOT NULL DEFAULT '',
                        original_file_name TEXT NOT NULL,
                        mime_type TEXT NOT NULL,
                        file_path TEXT NOT NULL,
                        workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                await run(`
                    CREATE TABLE IF NOT EXISTS document_links (
                        id TEXT PRIMARY KEY,
                        document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                        entity_id TEXT NOT NULL,
                        record_id TEXT NOT NULL
                    )
                `);

                await run(`
                    CREATE TABLE IF NOT EXISTS notes (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT NOT NULL DEFAULT '',
                        content_json TEXT NOT NULL DEFAULT '',
                        content_text TEXT NOT NULL DEFAULT '',
                        workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                await run(`
                    CREATE TABLE IF NOT EXISTS note_links (
                        id TEXT PRIMARY KEY,
                        note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
                        entity_id TEXT NOT NULL,
                        record_id TEXT NOT NULL
                    )
                `);

                await run(`
                    CREATE TABLE IF NOT EXISTS entity_views (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        entity_id TEXT NOT NULL,
                        filters TEXT NOT NULL DEFAULT '[]',
                        order_by TEXT NOT NULL DEFAULT '[]',
                        workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
                    )
                `);

                await run(`
                    CREATE INDEX IF NOT EXISTS idx_entity_views_entity_id ON entity_views(entity_id)
                `);

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    });

    // Seed a default workspace if none exist, so existing entity data isn't orphaned
    await new Promise<void>((resolve) => {
        db.run(
            `INSERT INTO workspaces (id, name, is_default)
             SELECT 'default', 'Default', 1
             WHERE NOT EXISTS (SELECT 1 FROM workspaces)`,
            () => {
                db.run(`UPDATE entities SET workspace_id = 'default' WHERE workspace_id IS NULL`, () => {
                    db.run(
                        `UPDATE entity_views
                         SET workspace_id = COALESCE(
                             (SELECT workspace_id FROM entities WHERE entities.id = entity_views.entity_id),
                             'default'
                         )
                         WHERE workspace_id IS NULL`,
                    () => {
                        db.run(`UPDATE documents SET workspace_id = 'default' WHERE workspace_id IS NULL`, () => {
                            db.run(`UPDATE notes SET workspace_id = 'default' WHERE workspace_id IS NULL`, () => resolve());
                        });
                    });
                });
            }
        );
    });

    // Add workspace_id column to entities if missing
    await new Promise<void>((resolve) => {
        db.all("PRAGMA table_info(entities)", (err, rows: any[]) => {
            if (err || !rows) { resolve(); return; }
            if (rows.some(r => r.name === 'workspace_id')) { resolve(); return; }
            db.run('ALTER TABLE entities ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL', () => {
                db.run(`UPDATE entities SET workspace_id = 'default' WHERE workspace_id IS NULL`, () => resolve());
            });
        });
    });

    // Add display_order column to entity_fields if missing
    await new Promise<void>((resolve) => {
        db.all("PRAGMA table_info(entity_fields)", (err, rows: any[]) => {
            if (err || !rows) { resolve(); return; }
            const hasDisplayOrder = rows.some(r => r.name === 'display_order');
            if (hasDisplayOrder) { resolve(); return; }
            db.run('ALTER TABLE entity_fields ADD COLUMN display_order INTEGER', () => {
                db.run(
                    `UPDATE entity_fields SET display_order = (
                        SELECT COUNT(*) FROM entity_fields ef2
                        WHERE ef2.entity_id = entity_fields.entity_id
                          AND ef2.created_at <= entity_fields.created_at
                          AND ef2.id != entity_fields.id
                    ) WHERE display_order IS NULL`,
                    () => resolve()
                );
            });
        });
    });

    // Add order_by column to entity_views if missing
    await new Promise<void>((resolve) => {
        db.all("PRAGMA table_info(entity_views)", (err, rows: any[]) => {
            if (err || !rows) { resolve(); return; }
            const hasOrderBy = rows.some(r => r.name === 'order_by');
            if (hasOrderBy) { resolve(); return; }
            db.run("ALTER TABLE entity_views ADD COLUMN order_by TEXT NOT NULL DEFAULT '[]'", () => resolve());
        });
    });

    // Add workspace_id column to entity_views if missing
    await new Promise<void>((resolve) => {
        db.all("PRAGMA table_info(entity_views)", (err, rows: any[]) => {
            if (err || !rows) { resolve(); return; }
            if (rows.some(r => r.name === 'workspace_id')) { resolve(); return; }
            db.run('ALTER TABLE entity_views ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL', () => {
                db.run(
                    `UPDATE entity_views
                     SET workspace_id = COALESCE(
                         (SELECT workspace_id FROM entities WHERE entities.id = entity_views.entity_id),
                         'default'
                     )
                     WHERE workspace_id IS NULL`,
                    () => resolve(),
                );
            });
        });
    });

    // Add workspace_id column to documents if missing
    await new Promise<void>((resolve) => {
        db.all("PRAGMA table_info(documents)", (err, rows: any[]) => {
            if (err || !rows) { resolve(); return; }
            if (rows.some(r => r.name === 'workspace_id')) { resolve(); return; }
            db.run('ALTER TABLE documents ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL', () => {
                db.run(`UPDATE documents SET workspace_id = 'default' WHERE workspace_id IS NULL`, () => resolve());
            });
        });
    });

    // Add workspace_id column to notes if missing
    await new Promise<void>((resolve) => {
        db.all("PRAGMA table_info(notes)", (err, rows: any[]) => {
            if (err || !rows) { resolve(); return; }
            if (rows.some(r => r.name === 'workspace_id')) { resolve(); return; }
            db.run('ALTER TABLE notes ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL', () => {
                db.run(`UPDATE notes SET workspace_id = 'default' WHERE workspace_id IS NULL`, () => resolve());
            });
        });
    });
}
