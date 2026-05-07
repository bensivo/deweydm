import { Injectable } from '@angular/core';

import { EntityRecord } from '../models/entity-record.model';
import { EntityField } from '../models/entity.model';
import { EntityRecordStore } from '../store/entity-record.store';
import { EntityStore } from '../store/entity.store';
import { generateEntityKey } from './entity-key.util';

@Injectable({ providedIn: 'root' })
export class EntityRecordService {
    constructor(
        private entityRecordStore: EntityRecordStore,
        private entityStore: EntityStore
    ) {}

    get records$() {
        return this.entityRecordStore.records$;
    }

    getAll(): EntityRecord[] {
        return this.entityRecordStore.getAll();
    }

    getById(id: string): EntityRecord | undefined {
        return this.entityRecordStore.getById(id);
    }

    getByEntityId(entityId: string): EntityRecord[] {
        return this.entityRecordStore.getByEntityId(entityId);
    }

    /**
     * Loads all records from the backend and replaces the store contents.
     * Call this on app init to hydrate state from the database.
     */
    async loadAll(): Promise<void> {
        const records: EntityRecord[] = await (window as any).electronApi.entityRecordGetAll();
        this.entityRecordStore.setAll(records);
    }

    /**
     * Creates a new EntityRecord in the backend and adds it to the store.
     *
     * @param entityId - The ID of the parent Entity
     * @param data - Field values keyed by EntityField.id
     *
     * @returns The newly created EntityRecord with its generated id
     */
    async createRecord(entityId: string, data: Record<string, string>): Promise<EntityRecord> {
        const record: EntityRecord = await (window as any).electronApi.entityRecordCreate(entityId, data);
        this.entityRecordStore.add(record);
        return record;
    }

    /**
     * Updates the field data on an existing record.
     *
     * @param id - The record id to update
     * @param data - New field values keyed by EntityField.id
     */
    async updateRecord(id: string, data: Record<string, string>): Promise<void> {
        await (window as any).electronApi.entityRecordUpdate(id, data);
        this.entityRecordStore.update(id, { data });
    }

    /**
     * Permanently deletes a record from the backend and the store.
     *
     * @param id - The record id to delete
     */
    async deleteRecord(id: string): Promise<void> {
        await (window as any).electronApi.entityRecordDelete(id);
        this.entityRecordStore.remove(id);
    }

    /**
     * Gets the display name for a record based on the entity's displayNameFieldId.
     *
     * @param entityId - The ID of the entity
     * @param recordId - The ID of the record
     * @returns The display name string, or recordId as fallback
     */
    getRecordDisplayName(entityId: string, recordId: string): string {
        const entity = this.entityStore.getById(entityId);
        const record = this.entityRecordStore.getById(recordId);

        if (!entity || !record) {
            return recordId;
        }

        // Use the displayNameFieldId if set, otherwise use first field
        const displayFieldId = entity.displayNameFieldId || entity.fields[0]?.id;
        if (!displayFieldId) {
            return recordId;
        }

        return record.data[displayFieldId] || recordId;
    }

    /**
     * Returns all records of sourceEntityId where the field sourceFieldId
     * points to targetRecordId. Supports both reference and reference-list field types.
     *
     * @param sourceEntityId - The entity that has the reference field
     * @param sourceFieldId - The specific reference field in that entity
     * @param targetRecordId - The record ID being referenced
     * @returns Array of backlinked records
     */
    getBacklinkedRecords(sourceEntityId: string, sourceFieldId: string, targetRecordId: string): EntityRecord[] {
        const sourceEntity = this.entityStore.getById(sourceEntityId);
        if (!sourceEntity) return [];

        const field = sourceEntity.fields.find(f => f.id === sourceFieldId);
        if (!field) return [];

        return this.entityRecordStore.getByEntityId(sourceEntityId).filter(record => {
            const fieldValue = record.data[sourceFieldId];
            if (!fieldValue) return false;

            // Handle reference field: exact match
            if (field.type === 'reference') {
                return fieldValue === targetRecordId;
            }

            // Handle reference-list field: check if targetRecordId is in comma-separated list
            if (field.type === 'reference-list') {
                return fieldValue.split(',').includes(targetRecordId);
            }

            return false;
        });
    }

    /**
     * Given a field of type 'reference' or 'reference-list', lookup the list
     * of potential records that can be referenced. 
     * 
     * E.g. If a 'task' entity has a 'project' reference field, this function will return the list of projects that can be used.
     *
     * @param field - An EntityField of type 'reference' or 'reference-list'
     * @returns Array of records that can be referenced, formatted as { label, value } for use in dropdowns
     */
    getReferenceOptions(field: EntityField): { recordName: string; recordId: string }[] {
        if (!field.referenceEntityId) return [];
        const referencedRecords = this.getByEntityId(field.referenceEntityId);
        return referencedRecords.map(record => ({
            recordName: this.getRecordDisplayName(field.referenceEntityId!, record.id),
            recordId: record.id
        }));
    }

    /**
     * Get the route key (slug) for navigating to a referenced entity.
     *
     * @param field - The field with a referenceEntityId
     * @returns The route-friendly key for the entity, or null if entity not found
     */
    getReferenceRouteKey(field: EntityField): string | null {
        if (!field.referenceEntityId) return null;
        const record = this.entityStore.getById(field.referenceEntityId);
        if (!record) return null;
        return generateEntityKey(record.name);
    }

    /**
     * Given a reference-list field (which stores record-ids in a CSV), extract the individual record IDs, 
     * then, lookup the records themselves and extract key inforamtion.
     *
     * @param value - The comma-separated record IDs from a reference-list field
     * @param field - The reference-list field
     * @returns Array of { label, id, routeKey } for each referenced record
     */
    getRefListItems(value: string, field: EntityField): EntityRecord[] {
        if (!value) return [];
        const ids = value.split(',');
        return ids.map(id => this.getById(id))
        .filter((record): record is EntityRecord => record !== undefined);
        // return ids.map(id => ({
        //     id,
        //     label: this.getRecordDisplayName(field.referenceEntityId!, id),
        //     routeKey: this.getReferenceRouteKey(field)
        // }));
    }
}
