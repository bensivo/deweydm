import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

import { EntityField } from '../../models/entity.model';

/**
 * Reusable modal for selecting a subset of entity fields. Used by bulk-edit,
 * bulk-create, and the entity-list column selector.
 *
 * Maintains an internal pending selection so the consumer only receives the
 * confirmed value when the user clicks OK.
 */
@Component({
    selector: 'app-field-selection-modal',
    imports: [CommonModule, FormsModule, NzModalModule, NzCheckboxModule],
    templateUrl: './field-selection-modal.component.html',
    styleUrl: './field-selection-modal.component.less'
})
export class FieldSelectionModalComponent {
    @Input() fields: EntityField[] = [];
    @Input() title: string = 'Select Fields';
    // Allow consumers to filter which fields appear (e.g., exclude backlinks)
    @Input() includeAllFields: boolean = false;

    @Input() set isOpen(value: boolean) {
        if (value && !this.isOpenSignal()) {
            // Sync pending from committed when opening
            this.pendingSignal.set(new Set(this.committedSignal()));
        }
        this.isOpenSignal.set(value);
    }
    get isOpen(): boolean {
        return this.isOpenSignal();
    }

    @Input() set committed(value: Set<string>) {
        this.committedSignal.set(new Set(value));
    }

    @Output() commit = new EventEmitter<Set<string>>();
    @Output() cancel = new EventEmitter<void>();

    isOpenSignal = signal<boolean>(false);
    pendingSignal = signal<Set<string>>(new Set());
    committedSignal = signal<Set<string>>(new Set());

    isFieldSelectable(field: EntityField): boolean {
        if (this.includeAllFields) return true;
        // By default, exclude backlink fields since they're read-only
        return field.type !== 'backlink';
    }

    isPendingFieldVisible(fieldId: string): boolean {
        return this.pendingSignal().has(fieldId);
    }

    onTogglePendingField(fieldId: string, checked: boolean): void {
        const pending = new Set(this.pendingSignal());
        if (checked) {
            pending.add(fieldId);
        } else {
            pending.delete(fieldId);
        }
        this.pendingSignal.set(pending);
    }

    onClickOk(): void {
        this.commit.emit(new Set(this.pendingSignal()));
    }

    onClickCancel(): void {
        this.cancel.emit();
    }
}
