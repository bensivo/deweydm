import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { EntityField } from '../../models/entity.model';
import { EntityRecordService } from '../../services/entity-record.service';
import { ReferenceListService } from '../../services/reference-list.service';

export interface BulkSpreadsheetRow {
    id?: string;
    data: Record<string, string>;
}

/**
 * Reusable spreadsheet-style editor for bulk-create and bulk-edit pages.
 * Supports text, number, reference, reference-list, and option fields with
 * tab/arrow key navigation between cells.
 */
@Component({
    selector: 'app-bulk-spreadsheet',
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzInputModule,
        NzSelectModule
    ],
    templateUrl: './bulk-spreadsheet.component.html',
    styleUrl: './bulk-spreadsheet.component.less'
})
export class BulkSpreadsheetComponent {
    @Input() set fields(value: EntityField[]) {
        this.fieldsSignal.set(value ?? []);
    }
    get fields(): EntityField[] {
        return this.fieldsSignal();
    }

    @Input() set rows(value: BulkSpreadsheetRow[]) {
        this.rowsSignal.set(value ?? []);
    }
    get rows(): BulkSpreadsheetRow[] {
        return this.rowsSignal();
    }

    // When true, last cell + last row Tab adds a new empty row (bulk-create behavior).
    // When false, Tab is allowed to bubble naturally (bulk-edit behavior).
    @Input() allowAddRowOnTab: boolean = false;

    // When true, shows a remove-row column with delete buttons (bulk-create behavior).
    @Input() showRemoveRowButton: boolean = false;

    @Output() rowsChange = new EventEmitter<BulkSpreadsheetRow[]>();

    @ViewChildren('cellInput') cellInputs!: QueryList<ElementRef<HTMLElement>>;

    fieldsSignal = signal<EntityField[]>([]);
    rowsSignal = signal<BulkSpreadsheetRow[]>([]);

    constructor(
        private entityRecordService: EntityRecordService,
        private referenceListService: ReferenceListService
    ) {}

    getCellValue(rowIndex: number, fieldId: string): string {
        const row = this.rowsSignal()[rowIndex];
        return row ? (row.data[fieldId] ?? '') : '';
    }

    setCellValue(rowIndex: number, fieldId: string, value: string): void {
        const rows = this.rowsSignal();
        const newRows = [...rows];
        if (!newRows[rowIndex]) return;
        newRows[rowIndex].data[fieldId] = value;
        this.rowsSignal.set(newRows);
        this.rowsChange.emit(newRows);
    }

    getReferenceOptions(field: EntityField) {
        return this.entityRecordService.getReferenceOptions(field);
    }

    getRefListValues(rowIndex: number, fieldId: string): string[] {
        return this.referenceListService.parseRefList(this.getCellValue(rowIndex, fieldId));
    }

    setRefListValues(rowIndex: number, fieldId: string, values: string[]): void {
        this.setCellValue(rowIndex, fieldId, this.referenceListService.stringifyRefList(values));
    }

    onClickRemoveRow(rowIndex: number): void {
        const rows = this.rowsSignal();
        const newRows = rows.filter((_, i) => i !== rowIndex);
        this.rowsSignal.set(newRows);
        this.rowsChange.emit(newRows);
    }

    onClickAddRow(): void {
        const rows = this.rowsSignal();
        const newRows = [...rows, { data: {} }];
        this.rowsSignal.set(newRows);
        this.rowsChange.emit(newRows);
    }

    onKeyDown(event: KeyboardEvent, rowIndex: number, fieldIndex: number): void {
        if (event.key !== 'Tab') return;

        const fields = this.fieldsSignal();
        const rows = this.rowsSignal();
        const isLastField = fieldIndex === fields.length - 1;
        const isLastRow = rowIndex === rows.length - 1;

        if (isLastField && isLastRow) {
            if (this.allowAddRowOnTab) {
                event.preventDefault();
                this.onClickAddRow();
                this.focusCellAsync(rowIndex + 1, 0);
            }
            // Otherwise allow natural tab behavior
            return;
        }

        event.preventDefault();
        if (isLastField) {
            this.focusCellAsync(rowIndex + 1, 0);
        } else {
            this.focusCellAsync(rowIndex, fieldIndex + 1);
        }
    }

    private focusCellAsync(rowIndex: number, fieldIndex: number): void {
        // Defer to allow QueryList to update if a row was just added
        setTimeout(() => {
            const fields = this.fieldsSignal();
            const targetIndex = rowIndex * fields.length + fieldIndex;
            const elementRef = this.cellInputs?.toArray()[targetIndex];
            if (!elementRef) return;
            const nativeElement = elementRef.nativeElement;
            // For nz-select, find the inner search input; for input, focus directly
            const input = nativeElement.querySelector('input');
            if (input) {
                (input as HTMLInputElement).focus();
            } else if (typeof (nativeElement as any).focus === 'function') {
                (nativeElement as HTMLElement).focus();
            }
        }, 0);
    }
}
