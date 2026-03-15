import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

import { EntityService } from '../../services/entity.service';
import { EntityRecordService } from '../../services/entity-record.service';
import { EntityField } from '../../models/entity.model';
import { generateEntityKey } from '../../services/entity-key.util';

@Component({
    selector: 'app-entity-bulk-create-page',
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzInputModule,
        NzFormModule,
        NzCardModule,
        NzSelectModule,
        NzModalModule,
        NzEmptyModule,
        NzCheckboxModule
    ],
    templateUrl: './entity-bulk-create.page.html',
    styleUrl: './entity-bulk-create.page.less'
})
export class EntityBulkCreatePageComponent implements OnInit {
    private entityKeySignal = signal<string>('');

    entity$ = computed(() => {
        const key = this.entityKeySignal();
        const entities = this.entityService.entities$();
        return entities.find(e => generateEntityKey(e.name) === key);
    });

    selectedFieldIdsSignal = signal<Set<string>>(new Set());
    pendingFieldIdsSignal = signal<Set<string>>(new Set());
    isFieldModalOpenSignal = signal<boolean>(false);

    // Bulk data: array of records, each is a map of fieldId -> value
    bulkDataSignal = signal<Record<string, string>[]>([{}]);

    // Cache for reference-list values to avoid infinite change detection loops
    private refListValueCache = new Map<string, { value: string; array: string[] }>();

    visibleFields$ = computed(() => {
        const entity = this.entity$();
        if (!entity) return [];
        const selected = this.selectedFieldIdsSignal();
        return entity.fields.filter(f => selected.has(f.id));
    });

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private entityService: EntityService,
        private entityRecordService: EntityRecordService
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const key = params['key'];
            this.entityKeySignal.set(key);
            const entity = this.entity$();
            if (!entity) {
                this.router.navigate(['/']);
                return;
            }
            // Initialize field selection - only select displayNameField by default
            const displayFieldId = entity.displayNameFieldId || entity.fields[0]?.id;
            const initialFields = displayFieldId ? new Set([displayFieldId]) : new Set<string>();
            this.selectedFieldIdsSignal.set(initialFields);
            this.pendingFieldIdsSignal.set(initialFields);
        });
    }

    onClickBackButton(): void {
        const entity = this.entity$();
        if (entity) {
            this.router.navigate(['/entity', generateEntityKey(entity.name)]);
        } else {
            this.router.navigate(['/']);
        }
    }

    onClickFieldsButton(): void {
        this.pendingFieldIdsSignal.set(new Set(this.selectedFieldIdsSignal()));
        this.isFieldModalOpenSignal.set(true);
    }

    onConfirmFields(): void {
        this.selectedFieldIdsSignal.set(new Set(this.pendingFieldIdsSignal()));
        this.isFieldModalOpenSignal.set(false);
    }

    onCancelFields(): void {
        this.isFieldModalOpenSignal.set(false);
    }

    onTogglePendingField(fieldId: string, checked: boolean): void {
        const pending = new Set(this.pendingFieldIdsSignal());
        if (checked) {
            pending.add(fieldId);
        } else {
            pending.delete(fieldId);
        }
        this.pendingFieldIdsSignal.set(pending);
    }

    isPendingFieldVisible(fieldId: string): boolean {
        return this.pendingFieldIdsSignal().has(fieldId);
    }

    isFieldSelectable(field: EntityField): boolean {
        // Exclude backlink fields since they're read-only
        return field.type !== 'backlink';
    }

    getCellValue(rowIndex: number, fieldId: string): string {
        const row = this.bulkDataSignal()[rowIndex];
        return row ? (row[fieldId] ?? '') : '';
    }

    setCellValue(rowIndex: number, fieldId: string, value: string): void {
        const bulkData = this.bulkDataSignal();
        const newData = [...bulkData];
        if (!newData[rowIndex]) {
            newData[rowIndex] = {};
        }
        newData[rowIndex][fieldId] = value;
        this.bulkDataSignal.set(newData);
    }

    onClickAddRow(): void {
        const bulkData = this.bulkDataSignal();
        this.bulkDataSignal.set([...bulkData, {}]);
    }

    onClickRemoveRow(rowIndex: number): void {
        const bulkData = this.bulkDataSignal();
        this.bulkDataSignal.set(bulkData.filter((_, i) => i !== rowIndex));
    }

    getReferenceOptions(field: EntityField){
        return this.entityRecordService.getReferenceOptions(field);
    }

    getRefListValues(rowIndex: number, fieldId: string): string[] {
        const value = this.getCellValue(rowIndex, fieldId);
        const cacheKey = `${rowIndex}:${fieldId}`;
        const cached = this.refListValueCache.get(cacheKey);

        // Return cached array if the underlying value hasn't changed
        if (cached && cached.value === value) {
            return cached.array;
        }

        // Create new array and cache it
        const array = value ? value.split(',') : [];
        this.refListValueCache.set(cacheKey, { value, array });
        return array;
    }

    setRefListValues(rowIndex: number, fieldId: string, values: string[]): void {
        const joined = values.join(',');
        this.setCellValue(rowIndex, fieldId, joined);
    }

    onKeyDown(event: KeyboardEvent, rowIndex: number, fieldIndex: number): void {
        if (event.key === 'Tab') {
            event.preventDefault();
            const visibleFields = this.visibleFields$();
            const isLastField = fieldIndex === visibleFields.length - 1;
            const bulkData = this.bulkDataSignal();
            const isLastRow = rowIndex === bulkData.length - 1;

            if (isLastField && isLastRow) {
                // Last cell in last row - add a new row and focus first cell
                this.onClickAddRow();
                setTimeout(() => {
                    const firstInput = document.querySelector(
                        `input[data-row="${rowIndex + 1}"][data-field-index="0"]`
                    ) as HTMLInputElement;
                    firstInput?.focus();
                }, 0);
            } else if (isLastField) {
                // Last field in this row - move to first field of next row
                setTimeout(() => {
                    const nextInput = document.querySelector(
                        `input[data-row="${rowIndex + 1}"][data-field-index="0"]`
                    ) as HTMLInputElement;
                    nextInput?.focus();
                }, 0);
            } else {
                // Move to next field in same row
                setTimeout(() => {
                    const nextInput = document.querySelector(
                        `input[data-row="${rowIndex}"][data-field-index="${fieldIndex + 1}"]`
                    ) as HTMLInputElement;
                    nextInput?.focus();
                }, 0);
            }
        }
    }

    onClickSave(): void {
        const entity = this.entity$();
        if (!entity) return;

        const bulkData = this.bulkDataSignal();
        let createdCount = 0;

        // Filter out completely empty rows and create records
        for (const rowData of bulkData) {
            // Check if row is completely empty
            const hasAnyValue = Object.values(rowData).some(val => val && val.trim() !== '');
            if (hasAnyValue) {
                this.entityRecordService.createRecord(entity.id, rowData);
                createdCount++;
            }
        }

        // Navigate back to the list page
        this.router.navigate(['/entity', generateEntityKey(entity.name)]);
    }
}
