import sqlite3 from 'sqlite3';

/**
 * A single record (instance) of a configurable entity.
 * `data` is keyed by EntityField.id with string values.
 */
export interface EntityRecord {
    id: string;
    entityId: string;
    data: Record<string, string>;
}

/**
 * Service for CRUD operations on entity record instances.
 * Records are stored in the `entity_records` table with the `data` map
 * serialized as JSON.
 */
export class EntityRecordService {
    private db: sqlite3.Database;

    constructor(db: sqlite3.Database) {
        this.db = db;
    }

    /**
     * Fetches all entity records.
     * @returns A promise resolving to an array of EntityRecord objects.
     */
    async getAll(): Promise<EntityRecord[]> {
        const rows = await this.allQuery<{ id: string; entity_id: string; data: string }>(
            'SELECT id, entity_id, data FROM entity_records'
        );
        return rows.map(row => this.rowToRecord(row));
    }

    /**
     * Fetches a single record by ID.
     * @param id - The record ID.
     * @returns A promise resolving to the EntityRecord, or undefined if not found.
     */
    async getById(id: string): Promise<EntityRecord | undefined> {
        const row = await this.getQuery<{ id: string; entity_id: string; data: string }>(
            'SELECT id, entity_id, data FROM entity_records WHERE id = ?',
            [id]
        );
        return row ? this.rowToRecord(row) : undefined;
    }

    /**
     * Fetches all records for a given entity.
     * @param entityId - The entity ID.
     * @returns A promise resolving to an array of EntityRecord objects.
     */
    async getByEntityId(entityId: string): Promise<EntityRecord[]> {
        const rows = await this.allQuery<{ id: string; entity_id: string; data: string }>(
            'SELECT id, entity_id, data FROM entity_records WHERE entity_id = ?',
            [entityId]
        );
        return rows.map(row => this.rowToRecord(row));
    }

    /**
     * Creates a new record for an entity.
     * @param entityId - The parent entity ID.
     * @param data - The field data, keyed by EntityField.id.
     * @returns A promise resolving to the created EntityRecord.
     */
    async createRecord(entityId: string, data: Record<string, string>): Promise<EntityRecord> {
        const id = this.generateId();
        await this.runQuery(
            'INSERT INTO entity_records (id, entity_id, data) VALUES (?, ?, ?)',
            [id, entityId, JSON.stringify(data)]
        );

        return {
            id,
            entityId,
            data,
        };
    }

    /**
     * Updates the data for an existing record.
     * @param id - The record ID.
     * @param data - The new field data.
     */
    async updateRecord(id: string, data: Record<string, string>): Promise<void> {
        await this.runQuery(
            'UPDATE entity_records SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [JSON.stringify(data), id]
        );
    }

    /**
     * Deletes a record by ID.
     * @param id - The record ID.
     */
    async deleteRecord(id: string): Promise<void> {
        await this.runQuery('DELETE FROM entity_records WHERE id = ?', [id]);
    }

    private rowToRecord(row: { id: string; entity_id: string; data: string }): EntityRecord {
        let parsedData: Record<string, string> = {};
        try {
            parsedData = JSON.parse(row.data);
        } catch (err) {
            console.error(`Failed to parse data for entity_record ${row.id}:`, err);
        }
        return {
            id: row.id,
            entityId: row.entity_id,
            data: parsedData,
        };
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // SQLite helper wrappers

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

    private getQuery<T>(sql: string, params: any[] = []): Promise<T | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row as T | undefined);
            });
        });
    }
}
