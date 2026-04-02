import { Component, computed, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { Entity, EntityField } from '../../models/entity.model';
import { EntityRecordService } from '../../services/entity-record.service';

/**
 * Modal component for creating records with entity form fields.
 * Displays form fields based on the selected entity and handles form submission.
 */
@Component({
    selector: 'app-global-create-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzModalModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzEmptyModule
    ],
    templateUrl: './form-modal.component.html',
    styleUrl: './form-modal.component.less'
})
export class FormModalComponent {
    isOpen = input.required<boolean>();
    entity = input.required<Entity | null>();
    formData = input.required<Record<string, string>>();

    onSubmit = output<Record<string, string>>();
    onCancel = output<void>();

    // Local form state
    private localFormDataSignal = signal<Record<string, string>>({});

    editableFields$ = computed(() => {
        const entity = this.entity();
        if (!entity) {
            return [];
        }
        // 'backlink' fields are read-only
        return entity.fields.filter(f => f.type !== 'backlink');
    });

    // Cache for reference-list values to avoid infinite change detection loops
    private refListValueCache = '';
    private refListValueCacheArray: string[] = [];

    constructor(private entityRecordService: EntityRecordService) {
        // Sync local form data with input when modal opens
        effect(() => {
            if (this.isOpen()) {
                this.localFormDataSignal.set({ ...this.formData() });
            }
        });
    }

    /**
     * Gets reference options for a field
     */
    getReferenceOptions(field: EntityField) {
        return this.entityRecordService.getReferenceOptions(field);
    }

    /**
     * Gets a field value from local form data
     *
     * @param fieldId - The field ID to retrieve
     * @returns The field value, or empty string if not found
     */
    getFieldValue(fieldId: string): string {
        return this.localFormDataSignal()[fieldId] ?? '';
    }

    /**
     * Gets reference-list field values as an array
     *
     * @param fieldId - The field ID to retrieve
     * @returns Array of selected record IDs
     */
    getRefListValues(fieldId: string): string[] {
        const value = this.getFieldValue(fieldId);
        // Cache the array to avoid creating new references on every change detection cycle
        if (value !== this.refListValueCache) {
            this.refListValueCache = value;
            this.refListValueCacheArray = value ? value.split(',') : [];
        }
        return this.refListValueCacheArray;
    }

    /**
     * Sets reference-list field values from array
     *
     * @param fieldId - The field ID to update
     * @param values - Array of record IDs to set
     */
    setRefListValues(fieldId: string, values: string[]): void {
        const joined = values.join(',');
        this.onFieldChange(fieldId, joined);
    }

    /**
     * Updates a field value in the local form data
     *
     * @param fieldId - The field ID to update
     * @param value - The new value
     */
    onFieldChange(fieldId: string, value: string): void {
        this.localFormDataSignal.update(current => ({ ...current, [fieldId]: value }));
    }

    onClickSubmit(): void {
        this.onSubmit.emit(this.localFormDataSignal());
    }

    onClickCancel(): void {
        this.onCancel.emit();
    }
}
