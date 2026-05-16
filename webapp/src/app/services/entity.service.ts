import { Inject, Injectable } from '@angular/core';

import { Entity, EntityField, FieldType } from '../models/entity.model';
import { EntityStore } from '../store/entity.store';
import { BACKEND_API } from '../backend/backend-api.token';
import { Backend } from '../backend/backend-api.interface';

@Injectable({ providedIn: 'root' })
export class EntityService {
    constructor(
        private entityStore: EntityStore,
        @Inject(BACKEND_API) private backend: Backend,
    ) {}

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
    async loadAll(workspaceId?: string): Promise<void> {
        const entities: Entity[] = await this.backend.entityGetAll(workspaceId);
        this.entityStore.setAll(entities);
    }

    async createEntity(name: string, pluralName: string, workspaceId?: string): Promise<Entity> {
        const entity: Entity = await this.backend.entityCreate(name, pluralName, workspaceId);
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
        const field: EntityField = await this.backend.entityAddField(
            entityId, fieldName, fieldType as FieldType, referenceEntityId, backlinkSourceEntityId, backlinkSourceFieldId, optionValues
        );

        const entity = this.entityStore.getById(entityId);
        if (!entity) return;

        this.entityStore.update(entityId, {
            fields: [...entity.fields, field],
        });
    }

    async removeField(entityId: string, fieldId: string): Promise<void> {
        await this.backend.entityRemoveField(entityId, fieldId);

        const entity = this.entityStore.getById(entityId);
        if (!entity) return;

        this.entityStore.update(entityId, {
            fields: entity.fields.filter(f => f.id !== fieldId),
        });
    }

    async deleteEntity(id: string): Promise<void> {
        await this.backend.entityDelete(id);
        this.entityStore.remove(id);
    }

    async reorderFields(entityId: string, orderedFieldIds: string[]): Promise<void> {
        await this.backend.entityReorderFields(entityId, orderedFieldIds);
        const entity = this.entityStore.getById(entityId);
        if (!entity) return;

        // Re-sort the in-memory fields array to match the new order
        const fieldById = new Map(entity.fields.map(f => [f.id, f]));
        const reordered = orderedFieldIds
            .map(id => fieldById.get(id))
            .filter((f): f is EntityField => !!f);

        this.entityStore.update(entityId, { fields: reordered });
    }

    async moveField(entityId: string, fieldId: string, direction: 'up' | 'down'): Promise<void> {
        const entity = this.entityStore.getById(entityId);
        if (!entity) return;
        const idx = entity.fields.findIndex(f => f.id === fieldId);
        if (idx < 0) return;
        const swapWith = direction === 'up' ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= entity.fields.length) return;

        const newOrder = entity.fields.map(f => f.id);
        [newOrder[idx], newOrder[swapWith]] = [newOrder[swapWith], newOrder[idx]];
        await this.reorderFields(entityId, newOrder);
    }

    async setDisplayNameField(entityId: string, fieldId: string): Promise<void> {
        await this.backend.entitySetDisplayNameField(entityId, fieldId);
        this.entityStore.update(entityId, { displayNameFieldId: fieldId });
    }
}
