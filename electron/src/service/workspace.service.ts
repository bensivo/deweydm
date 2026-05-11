import sqlite3 from 'sqlite3';

export interface Workspace {
    id: string;
    name: string;
    isDefault: boolean;
    createdAt: string;
}

export class WorkspaceService {
    private db: sqlite3.Database;

    constructor(db: sqlite3.Database) {
        this.db = db;
    }

    /**
     * Fetches all workspaces from the database.
     * @returns A promise resolving to an array of Workspace objects.
     */
    async getAll(): Promise<Workspace[]> {
        const rows = await this.allQuery<{ id: string; name: string; is_default: number; created_at: string }>(
            'SELECT id, name, is_default, created_at FROM workspaces ORDER BY created_at ASC'
        );
        return rows.map(r => ({
            id: r.id,
            name: r.name,
            isDefault: r.is_default === 1,
            createdAt: r.created_at,
        }));
    }

    /**
     * Creates a new workspace with the given name.
     * @param name - The display name of the workspace.
     * @returns A promise resolving to the created Workspace.
     */
    async create(name: string): Promise<Workspace> {
        const id = this.generateId();
        const now = new Date().toISOString();
        await this.runQuery(
            'INSERT INTO workspaces (id, name, is_default) VALUES (?, ?, 0)',
            [id, name]
        );
        return {
            id,
            name,
            isDefault: false,
            createdAt: now,
        };
    }

    /**
     * Deletes a workspace by id.
     * @param id - The workspace ID to delete.
     */
    async delete(id: string): Promise<void> {
        await this.runQuery('DELETE FROM workspaces WHERE id = ?', [id]);
    }

    /**
     * Sets the default workspace. Clears is_default on all others first.
     * @param id - The workspace ID to mark as default.
     */
    async setDefault(id: string): Promise<void> {
        await this.runQuery('UPDATE workspaces SET is_default = 0');
        await this.runQuery('UPDATE workspaces SET is_default = 1 WHERE id = ?', [id]);
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
