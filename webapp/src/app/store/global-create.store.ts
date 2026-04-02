import { computed, Injectable, signal } from '@angular/core';

import { EntityService } from '../services/entity.service';

/**
 * Manages state for the global create workflow modal system.
 * Handles two-step modal flow: entity selection → record creation form.
 */
@Injectable({ providedIn: 'root' })
export class GlobalCreateStore {
    private isCreateModalOpenSignal = signal<boolean>(false);
    private isFormModalOpenSignal = signal<boolean>(false);
    private selectedEntityIdSignal = signal<string | null>(null);
    private formDataSignal = signal<Record<string, string>>({});

    public isCreateModalOpen$ = this.isCreateModalOpenSignal.asReadonly();
    public isFormModalOpen$ = this.isFormModalOpenSignal.asReadonly();
    public selectedEntityId$ = this.selectedEntityIdSignal.asReadonly();
    public formData$ = this.formDataSignal.asReadonly();

    public selectedEntity$ = computed(() => {
        const entityId = this.selectedEntityIdSignal();
        if (!entityId) return null;
        return this.entityService.entities$().find(e => e.id === entityId) || null;
    });

    constructor(private entityService: EntityService) {}

    /**
     * Opens the entity selection modal and resets form state
     */
    openEntitySelectModal(): void {
        this.isCreateModalOpenSignal.set(true);
        this.isFormModalOpenSignal.set(false);
        this.selectedEntityIdSignal.set(null);
        this.formDataSignal.set({});
    }

    /**
     * Selects an entity and transitions to the form modal
     *
     * @param entityId - The ID of the entity to select
     */
    selectEntity(entityId: string): void {
        this.selectedEntityIdSignal.set(entityId);
        this.isCreateModalOpenSignal.set(false);
        this.isFormModalOpenSignal.set(true);

        // Initialize form data for selected entity
        const entity = this.entityService.entities$().find(e => e.id === entityId);
        if (entity) {
            const initialData: Record<string, string> = {};
            entity.fields.forEach(f => {
                initialData[f.id] = '';
            });
            this.formDataSignal.set(initialData);
        }
    }

    /**
     * Closes all modals and resets state
     */
    closeCreateFlow(): void {
        this.isCreateModalOpenSignal.set(false);
        this.isFormModalOpenSignal.set(false);
        this.selectedEntityIdSignal.set(null);
        this.formDataSignal.set({});
    }

    /**
     * Updates a field value in the form data
     *
     * @param fieldId - The field ID to update
     * @param value - The new value
     */
    setFieldValue(fieldId: string, value: string): void {
        this.formDataSignal.update(current => ({ ...current, [fieldId]: value }));
    }

    /**
     * Gets a field value from the form data
     *
     * @param fieldId - The field ID to retrieve
     * @returns The field value, or empty string if not found
     */
    getFieldValue(fieldId: string): string {
        return this.formDataSignal()[fieldId] ?? '';
    }
}
