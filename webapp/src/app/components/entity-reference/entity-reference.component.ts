import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EntityStore } from '../../store/entity.store';
import { EntityRecordStore } from '../../store/entity-record.store';
import { generateEntityKey } from '../../services/entity-key.util';

/**
 * Displays a clickable reference to an entity record.
 * Shows the record's display name as a link to the entity detail page.
 */
@Component({
    selector: 'app-entity-reference',
    imports: [CommonModule, RouterModule],
    templateUrl: './entity-reference.component.html',
    styleUrl: './entity-reference.component.less'
})
export class EntityReferenceComponent {
    // The entity record ID to display
    recordId = input.required<string>();

    constructor(
        private entityRecordStore: EntityRecordStore,
        private entityStore: EntityStore
    ) {}

    /**
     * Get the entity record by ID
     *
     * @returns The entity record, or undefined if not found
     */
    getRecord() {
        return this.entityRecordStore.getById(this.recordId());
    }

    /**
     * Get the entity definition for this record
     *
     * @returns The entity, or undefined if not found
     */
    getEntity() {
        const record = this.getRecord();
        if (!record) return undefined;
        return this.entityStore.getById(record.entityId);
    }

    /**
     * Get the display name value for the record
     *
     * @returns The display name, or record ID as fallback
     */
    getDisplayName(): string {
        const record = this.getRecord();
        const entity = this.getEntity();

        if (!record || !entity) return this.recordId();

        const displayFieldId = entity.displayNameFieldId || entity.fields[0]?.id;
        return displayFieldId ? (record.data?.[displayFieldId] || record.id) : record.id;
    }

    /**
     * Get the route key for the entity
     *
     * @returns The route key for use in navigation
     */
    getEntityRouteKey(): string {
        const entity = this.getEntity();
        return entity ? generateEntityKey(entity.name) : '';
    }
}
