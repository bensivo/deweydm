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
    selector: 'app-entity-bulk-edit-page',
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzCardModule,
        NzEmptyModule,
        BulkSpreadsheetComponent,
        FieldSelectionModalComponent
    ],
    templateUrl: './entity-bulk-edit.page.html',
    styleUrl: './entity-bulk-edit.page.less'
})
export class EntityBulkEditPageComponent implements OnInit {
    private entityKeySignal = signal<string>('');
    private hasInitializedFieldsSignal = signal<boolean>(false);

    entity$ = computed(() => {
        const key = this.entityKeySignal();
        const entities = this.entityService.entities$();
        return entities.find(e => generateEntityKey(e.name) === key);
    });

    selectedFieldIdsSignal = signal<Set<string>>(new Set());
    isFieldModalOpenSignal = signal<boolean>(false);

    recordIdsSignal = signal<string[]>([]);

    // Bulk data: array of {id, data} objects
    bulkDataSignal = signal<BulkSpreadsheetRow[]>([]);

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
        // Resolve the entity type, based on the entity-configs in teh store and the URL param.
        // This then gives us what fields are available for bulk create/edit
        effect(() => {
            const key = this.entityKeySignal();
            const entities = this.entityService.entities$();

            if (!key) return;
            // Wait for entities to load before deciding to redirect
            if (entities.length === 0) return;

            const entity = entities.find(e => generateEntityKey(e.name) === key);
            if (!entity) {
                this.router.navigate(['/']);
                return;
            }

            // Initialize field selection once entity is found
            if (!this.hasInitializedFieldsSignal()) {
                const initialFields = new Set<string>(
                    entity.fields.filter(f => f.type !== 'backlink').map(f => f.id)
                );
                this.selectedFieldIdsSignal.set(initialFields);
                this.hasInitializedFieldsSignal.set(true);
            }
        });
    }

    ngOnInit(): void {
        // Read route params synchronously from snapshot — no nested subscriptions needed.
        const key = this.route.snapshot.params['key'];
        this.entityKeySignal.set(key);

        const idsParam = this.route.snapshot.queryParamMap.get('ids') || '';
        const ids = idsParam ? idsParam.split(',').filter(id => id.length > 0) : [];
        this.recordIdsSignal.set(ids);

        const records = this.entityRecordService.getRecordsByIds(ids);
        const rows: BulkSpreadsheetRow[] = records.map(record => ({ id: record.id, data: { ...record.data } }));
        this.bulkDataSignal.set(rows);
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

        // Do NOT filter empty rows - bulk edit can intentionally clear values
        const rows = this.bulkDataSignal()
            .filter((r): r is { id: string; data: Record<string, string> } => !!r.id);
        await this.entityRecordService.bulkUpdateRecords(rows);

        this.router.navigate(['/entity', generateEntityKey(entity.name)]);
    }
}
