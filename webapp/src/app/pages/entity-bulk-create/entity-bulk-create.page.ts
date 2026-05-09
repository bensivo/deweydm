import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { EntityService } from '../../services/entity.service';
import { EntityRecordService } from '../../services/entity-record.service';
import { generateEntityKey } from '../../services/entity-key.util';
import { BulkSpreadsheetComponent, BulkSpreadsheetRow } from '../../components/bulk-spreadsheet/bulk-spreadsheet.component';
import { FieldSelectionModalComponent } from '../../components/field-selection-modal/field-selection-modal.component';

@Component({
    selector: 'app-entity-bulk-create-page',
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzCardModule,
        NzEmptyModule,
        BulkSpreadsheetComponent,
        FieldSelectionModalComponent
    ],
    templateUrl: './entity-bulk-create.page.html',
    styleUrl: './entity-bulk-create.page.less'
})
export class EntityBulkCreatePageComponent implements OnInit {
    private entityKeySignal = signal<string>('');
    private hasInitializedFieldsSignal = signal<boolean>(false);

    entity$ = computed(() => {
        const key = this.entityKeySignal();
        const entities = this.entityService.entities$();
        return entities.find(e => generateEntityKey(e.name) === key);
    });

    selectedFieldIdsSignal = signal<Set<string>>(new Set());
    isFieldModalOpenSignal = signal<boolean>(false);

    // Bulk data: array of records, seeded with one empty row.
    bulkDataSignal = signal<BulkSpreadsheetRow[]>([{ data: {} }]);

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
    ) {
        // Resolve the entity type, based on the entity-configs in the store and the URL param.
        // This then gives us what fields are available for bulk create/edit
        effect(() => {
            const key = this.entityKeySignal();
            const entities = this.entityService.entities$();

            if (!key) return;
            if (entities.length === 0) return;

            const entity = entities.find(e => generateEntityKey(e.name) === key);
            if (!entity) {
                this.router.navigate(['/']);
                return;
            }

            if (!this.hasInitializedFieldsSignal()) {
                // Default: only display-name field selected
                const displayFieldId = entity.displayNameFieldId || entity.fields[0]?.id;
                const initialFields = displayFieldId ? new Set([displayFieldId]) : new Set<string>();
                this.selectedFieldIdsSignal.set(initialFields);
                this.hasInitializedFieldsSignal.set(true);
            }
        });
    }

    ngOnInit(): void {
        const key = this.route.snapshot.params['key'];
        this.entityKeySignal.set(key);
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
        this.isFieldModalOpenSignal.set(true);
    }

    onCommitFields(selected: Set<string>): void {
        this.selectedFieldIdsSignal.set(selected);
        this.isFieldModalOpenSignal.set(false);
    }

    onCancelFields(): void {
        this.isFieldModalOpenSignal.set(false);
    }

    onRowsChange(rows: BulkSpreadsheetRow[]): void {
        this.bulkDataSignal.set(rows);
    }

    async onClickSave(): Promise<void> {
        const entity = this.entity$();
        if (!entity) return;

        const bulkData = this.bulkDataSignal();

        // Filter out completely empty rows and create records
        for (const row of bulkData) {
            const hasAnyValue = Object.values(row.data).some(val => val && val.trim() !== '');
            if (hasAnyValue) {
                await this.entityRecordService.createRecord(entity.id, row.data);
            }
        }

        this.router.navigate(['/entity', generateEntityKey(entity.name)]);
    }
}
