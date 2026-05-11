import sqlite3 from 'sqlite3';

export class ColumnVisibilityService {
    private db: sqlite3.Database;

    constructor(db: sqlite3.Database) {
        this.db = db;
    }

    /**
     * Returns the persisted visible field IDs for a context, or null if none saved.
     *
     * @param contextType - 'entity-list' or 'view'
     * @param contextId - entityId or viewId
     * @returns Array of visible field IDs, or null if no preference saved
     */
    async get(contextType: string, contextId: string): Promise<string[] | null> {
        const rows = await this.allQuery<{ field_ids: string }>(
            'SELECT field_ids FROM column_visibility WHERE context_type = ? AND context_id = ?',
            [contextType, contextId]
        );
        if (rows.length === 0) return null;
        try {
            return JSON.parse(rows[0].field_ids) as string[];
        } catch {
            return null;
        }
    }

    /**
     * Persists the visible field IDs for a context, replacing any existing value.
     *
     * @param contextType - 'entity-list' or 'view'
     * @param contextId - entityId or viewId
     * @param fieldIds - The field IDs currently visible
     */
    async set(contextType: string, contextId: string, fieldIds: string[]): Promise<void> {
        await this.runQuery(
            `INSERT INTO column_visibility (context_type, context_id, field_ids)
             VALUES (?, ?, ?)
             ON CONFLICT(context_type, context_id) DO UPDATE SET field_ids = excluded.field_ids`,
            [contextType, contextId, JSON.stringify(fieldIds)]
        );
    }

    private runQuery(sql: string, params: any[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    private allQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows as T[]);
            });
        });
    }
}
