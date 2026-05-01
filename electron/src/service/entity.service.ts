import sqlite3 from 'sqlite3';

export type FieldType = 'short-text' | 'long-text' | 'number' | 'reference' | 'backlink' | 'option' | 'reference-list';

export interface EntityField {
    id: string;
    name: string;
    type: FieldType;
    referenceEntityId?: string;
    backlinkSourceEntityId?: string;
    backlinkSourceFieldId?: string;
    optionValues?: string[];
}

export interface Entity {
    id: string;
    name: string;
    pluralName: string;
    fields: EntityField[];
    displayNameFieldId?: string;
}

export class EntityService {
    private db: sqlite3.Database;

    constructor(db: sqlite3.Database) {
        this.db = db;
    }

    /**
     * Fetches all entities with their fields and option values.
     * @returns A promise resolving to an array of Entity objects.
     */
    async getAll(): Promise<Entity[]> {
        const entityRows = await this.allQuery<{ id: string; name: string; plural_name: string; display_name_field_id: string | null }>(
            'SELECT id, name, plural_name, display_name_field_id FROM entities'
        );

        const entities: Entity[] = [];
        for (const row of entityRows) {
            const fields = await this.getFieldsForEntity(row.id);
            entities.push({
                id: row.id,
                name: row.name,
                pluralName: row.plural_name,
                fields,
                displayNameFieldId: row.display_name_field_id ?? undefined,
            });
        }

        return entities;
    }

    /**
     * Fetches a single entity by ID, including its fields and option values.
     * @param id - The entity ID.
     * @returns A promise resolving to the Entity, or undefined if not found.
     */
    async getById(id: string): Promise<Entity | undefined> {
        const row = await this.getQuery<{ id: string; name: string; plural_name: string; display_name_field_id: string | null }>(
            'SELECT id, name, plural_name, display_name_field_id FROM entities WHERE id = ?',
            [id]
        );

        if (!row) {
            return undefined;
        }

        const fields = await this.getFieldsForEntity(row.id);
        return {
            id: row.id,
            name: row.name,
            pluralName: row.plural_name,
            fields,
            displayNameFieldId: row.display_name_field_id ?? undefined,
        };
    }

    /**
     * Creates a new entity with the given name and plural name.
     * @param name - The singular name of the entity.
     * @param pluralName - The plural name of the entity.
     * @returns A promise resolving to the created Entity.
     */
    async createEntity(name: string, pluralName: string): Promise<Entity> {
        const id = this.generateId();
        await this.runQuery(
            'INSERT INTO entities (id, name, plural_name) VALUES (?, ?, ?)',
            [id, name, pluralName]
        );

        return {
            id,
            name,
            pluralName,
            fields: [],
        };
    }

    /**
     * Deletes an entity and its associated fields and option values (via CASCADE).
     * @param id - The entity ID to delete.
     */
    async deleteEntity(id: string): Promise<void> {
        await this.runQuery('DELETE FROM entities WHERE id = ?', [id]);
    }

    /**
     * Sets the display name field for an entity.
     * @param entityId - The entity ID.
     * @param fieldId - The field ID to use as the display name.
     */
    async setDisplayNameField(entityId: string, fieldId: string): Promise<void> {
        await this.runQuery(
            'UPDATE entities SET display_name_field_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [fieldId, entityId]
        );
    }

    /**
     * Adds a field to an entity, including option values if the field type is 'option'.
     * @param entityId - The entity ID to add the field to.
     * @param fieldName - The name of the field.
     * @param fieldType - The type of the field.
     * @param referenceEntityId - The referenced entity ID (for 'reference' and 'reference-list' types).
     * @param backlinkSourceEntityId - The source entity ID (for 'backlink' type).
     * @param backlinkSourceFieldId - The source field ID (for 'backlink' type).
     * @param optionValues - The option values (for 'option' type).
     * @returns A promise resolving to the created EntityField.
     */
    async addField(
        entityId: string,
        fieldName: string,
        fieldType: FieldType,
        referenceEntityId?: string,
        backlinkSourceEntityId?: string,
        backlinkSourceFieldId?: string,
        optionValues?: string[],
    ): Promise<EntityField> {
        const fieldId = this.generateId();

        await this.runQuery(
            `INSERT INTO entity_fields (id, entity_id, name, type, reference_entity_id, backlink_source_entity_id, backlink_source_field_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [fieldId, entityId, fieldName, fieldType, referenceEntityId ?? null, backlinkSourceEntityId ?? null, backlinkSourceFieldId ?? null]
        );

        if (fieldType === 'option' && optionValues && optionValues.length > 0) {
            for (let i = 0; i < optionValues.length; i++) {
                await this.runQuery(
                    'INSERT INTO entity_field_options (field_id, option_value, display_order) VALUES (?, ?, ?)',
                    [fieldId, optionValues[i], i]
                );
            }
        }

        return {
            id: fieldId,
            name: fieldName,
            type: fieldType,
            referenceEntityId,
            backlinkSourceEntityId,
            backlinkSourceFieldId,
            optionValues,
        };
    }

    /**
     * Removes a field from an entity, including its option values (via CASCADE).
     * @param entityId - The entity ID.
     * @param fieldId - The field ID to remove.
     */
    async removeField(entityId: string, fieldId: string): Promise<void> {
        await this.runQuery(
            'DELETE FROM entity_fields WHERE id = ? AND entity_id = ?',
            [fieldId, entityId]
        );
    }

    /**
     * Fetches all fields for a given entity, including option values.
     */
    private async getFieldsForEntity(entityId: string): Promise<EntityField[]> {
        const fieldRows = await this.allQuery<{
            id: string;
            name: string;
            type: FieldType;
            reference_entity_id: string | null;
            backlink_source_entity_id: string | null;
            backlink_source_field_id: string | null;
        }>(
            'SELECT id, name, type, reference_entity_id, backlink_source_entity_id, backlink_source_field_id FROM entity_fields WHERE entity_id = ?',
            [entityId]
        );

        const fields: EntityField[] = [];
        for (const fieldRow of fieldRows) {
            let optionValues: string[] | undefined;
            if (fieldRow.type === 'option') {
                const optionRows = await this.allQuery<{ option_value: string }>(
                    'SELECT option_value FROM entity_field_options WHERE field_id = ? ORDER BY display_order',
                    [fieldRow.id]
                );
                optionValues = optionRows.map(o => o.option_value);
            }

            fields.push({
                id: fieldRow.id,
                name: fieldRow.name,
                type: fieldRow.type,
                referenceEntityId: fieldRow.reference_entity_id ?? undefined,
                backlinkSourceEntityId: fieldRow.backlink_source_entity_id ?? undefined,
                backlinkSourceFieldId: fieldRow.backlink_source_field_id ?? undefined,
                optionValues,
            });
        }

        return fields;
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
