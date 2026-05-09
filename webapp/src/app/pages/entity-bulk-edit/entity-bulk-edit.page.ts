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
import { ReferenceListService } from '../../services/reference-list.service';
import { EntityField } from '../../models/entity.model';
import { generateEntityKey } from '../../services/entity-key.util';
import { ModalState } from '../../utils/modal-state.util';

@Component({
    selector: 'app-entity-bulk-edit-page',
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
    templateUrl: './entity-bulk-edit.page.html',
    styleUrl: './entity-bulk-edit.page.less'
})
export class EntityBulkEditPageComponent implements OnInit {
    private entityKeySignal = signal<string>('');

    entity$ = computed(() => {
        const key = this.entityKeySignal();
        const entities = this.entityService.entities$();
        return entities.find(e => generateEntityKey(e.name) === key);
    });

    fieldModalState = new ModalState<Set<string>>(new Set(), (set) => new Set(set));

    recordIdsSignal = signal<string[]>([]);

    // Bulk data: array of {id, data} objects, each is a map of fieldId -> value
    bulkDataSignal = signal<{ id: string; data: Record<string, string> }[]>([]);

    visibleFields$ = computed(() => {
        const entity = this.entity$();
        if (!entity) return [];
        const selected = this.fieldModalState.committed$();
        return entity.fields.filter(f => selected.has(f.id));
    });

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private entityService: EntityService,
        private entityRecordService: EntityRecordService,
        private referenceListService: ReferenceListService
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
            // Initialize field selection - select all non-backlink fields by default
            const initialFields = new Set<string>(
                entity.fields.filter(f => f.type !== 'backlink').map(f => f.id)
            );
            this.fieldModalState.committed$.set(initialFields);

            // Read ids from query params and seed bulk data
            this.route.queryParams.subscribe(queryParams => {
                const idsParam: string = queryParams['ids'] || '';
                const ids = idsParam ? idsParam.split(',').filter(id => id.length > 0) : [];
                this.recordIdsSignal.set(ids);

                const records = this.entityRecordService.getRecordsByIds(ids);
                const rows = records.map(record => ({ id: record.id, data: { ...record.data } }));
                this.bulkDataSignal.set(rows);
            });
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
        this.fieldModalState.open();
    }

    onConfirmFields(): void {
        this.fieldModalState.confirm();
    }

    onCancelFields(): void {
        this.fieldModalState.cancel();
    }

    onTogglePendingField(fieldId: string, checked: boolean): void {
        const pending = new Set(this.fieldModalState.pending$());
        if (checked) {
            pending.add(fieldId);
        } else {
            pending.delete(fieldId);
        }
        this.fieldModalState.pending$.set(pending);
    }

    isPendingFieldVisible(fieldId: string): boolean {
        return this.fieldModalState.pending$().has(fieldId);
    }

    isFieldSelectable(field: EntityField): boolean {
        // Exclude backlink fields since they're read-only
        return field.type !== 'backlink';
    }

    getCellValue(rowIndex: number, fieldId: string): string {
        const row = this.bulkDataSignal()[rowIndex];
        return row ? (row.data[fieldId] ?? '') : '';
    }

    setCellValue(rowIndex: number, fieldId: string, value: string): void {
        const bulkData = this.bulkDataSignal();
        const newData = [...bulkData];
        if (!newData[rowIndex]) return;
        newData[rowIndex].data[fieldId] = value;
        this.bulkDataSignal.set(newData);
    }

    getReferenceOptions(field: EntityField){
        return this.entityRecordService.getReferenceOptions(field);
    }

    getRefListValues(rowIndex: number, fieldId: string): string[] {
        return this.referenceListService.parseRefList(this.getCellValue(rowIndex, fieldId));
    }

    setRefListValues(rowIndex: number, fieldId: string, values: string[]): void {
        this.setCellValue(rowIndex, fieldId, this.referenceListService.stringifyRefList(values));
    }

    onKeyDown(event: KeyboardEvent, rowIndex: number, fieldIndex: number): void {
        if (event.key === 'Tab') {
            const visibleFields = this.visibleFields$();
            const isLastField = fieldIndex === visibleFields.length - 1;
            const bulkData = this.bulkDataSignal();
            const isLastRow = rowIndex === bulkData.length - 1;

            if (isLastField && isLastRow) {
                // Bulk edit has a fixed set of rows - allow natural tab behavior
                return;
            }

            event.preventDefault();
            if (isLastField) {
                // Move to first field of next row
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

    async onClickSave(): Promise<void> {
        const entity = this.entity$();
        if (!entity) return;

        // Do NOT filter empty rows - bulk edit can intentionally clear values
        await this.entityRecordService.bulkUpdateRecords(this.bulkDataSignal());

        this.router.navigate(['/entity', generateEntityKey(entity.name)]);
    }
}
