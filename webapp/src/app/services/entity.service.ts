import { Injectable } from '@angular/core';

import { Entity, EntityField } from '../models/entity.model';
import { EntityStore } from '../store/entity.store';

@Injectable({ providedIn: 'root' })
export class EntityService {
    constructor(private entityStore: EntityStore) {}

    get entities$() {
        return this.entityStore.entities$;
    }

    getAll(): Entity[] {
        return this.entityStore.getAll();
    }

    getById(id: string): Entity | undefined {
        return this.entityStore.getById(id);
    }

    /**
     * Loads all entities from the backend and replaces the store contents.
     * Call this on app init to hydrate state from the database.
     */
    async loadAll(): Promise<void> {
        const entities: Entity[] = await (window as any).electronApi.entityGetAll();
        this.entityStore.setAll(entities);
    }

    async createEntity(name: string, pluralName: string): Promise<Entity> {
        const entity: Entity = await (window as any).electronApi.entityCreate(name, pluralName);
        this.entityStore.add(entity);
        return entity;
    }

    async addField(
        entityId: string,
        fieldName: string,
        fieldType: string,
        referenceEntityId?: string,
        backlinkSourceEntityId?: string,
        backlinkSourceFieldId?: string,
        optionValues?: string[],
    ): Promise<void> {
        const field: EntityField = await (window as any).electronApi.entityAddField(
            entityId, fieldName, fieldType, referenceEntityId, backlinkSourceEntityId, backlinkSourceFieldId, optionValues
        );

        const entity = this.entityStore.getById(entityId);
        if (!entity) return;

        this.entityStore.update(entityId, {
            fields: [...entity.fields, field],
        });
    }

    async removeField(entityId: string, fieldId: string): Promise<void> {
        await (window as any).electronApi.entityRemoveField(entityId, fieldId);

        const entity = this.entityStore.getById(entityId);
        if (!entity) return;

        this.entityStore.update(entityId, {
            fields: entity.fields.filter(f => f.id !== fieldId),
        });
    }

    async deleteEntity(id: string): Promise<void> {
        await (window as any).electronApi.entityDelete(id);
        this.entityStore.remove(id);
    }

    async setDisplayNameField(entityId: string, fieldId: string): Promise<void> {
        await (window as any).electronApi.entitySetDisplayNameField(entityId, fieldId);
        this.entityStore.update(entityId, { displayNameFieldId: fieldId });
    }
}
