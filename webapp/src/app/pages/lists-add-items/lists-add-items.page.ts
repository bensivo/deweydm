import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { ListsStore } from '../../store/lists.store';
import { EntityService } from '../../services/entity.service';
import { EntityRecordService } from '../../services/entity-record.service';

@Component({
    selector: 'app-lists-add-items-page',
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzInputModule,
        NzSelectModule,
        NzCheckboxModule,
        NzEmptyModule
    ],
    templateUrl: './lists-add-items.page.html',
    styleUrl: './lists-add-items.page.less'
})
export class ListsAddItemsPageComponent implements OnInit {
    private listIdSignal = signal<string>('');
    selectedEntityIdSignal = signal<string>('');
    searchQuerySignal = signal<string>('');
    selectedRecordIdsSignal = signal<Set<string>>(new Set());

    list$ = computed(() => {
        const listId = this.listIdSignal();
        return this.listsStore.getListById(listId);
    });

    allEntities$ = computed(() => {
        return this.entityService.getAll();
    });

    filteredRecords$ = computed(() => {
        const selectedEntityId = this.selectedEntityIdSignal();
        const searchQuery = this.searchQuerySignal().toLowerCase();

        if (!selectedEntityId) return [];

        const records = this.entityRecordService.getByEntityId(selectedEntityId);

        if (!searchQuery) return records;

        return records.filter(record => {
            const dataValues = Object.values(record.data).join(' ').toLowerCase();
            return dataValues.includes(searchQuery);
        });
    });

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private listsStore: ListsStore,
        private entityService: EntityService,
        private entityRecordService: EntityRecordService
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.listIdSignal.set(params['id']);
        });
    }

    onClickCancel(): void {
        this.router.navigate(['/lists', this.listIdSignal()]);
    }

    onToggleRecord(recordId: string, checked: boolean): void {
        this.selectedRecordIdsSignal.update(current => {
            const newSet = new Set(current);
            if (checked) {
                newSet.add(recordId);
            } else {
                newSet.delete(recordId);
            }
            return newSet;
        });
    }

    onClickAddSelected(): void {
        const listId = this.listIdSignal();
        const selectedEntityId = this.selectedEntityIdSignal();
        const selectedIds = this.selectedRecordIdsSignal();

        if (!listId || !selectedEntityId || selectedIds.size === 0) return;

        this.listsStore.addItemIdsToList(listId, Array.from(selectedIds));
        this.router.navigate(['/lists', listId]);
    }

    isRecordSelected(recordId: string): boolean {
        return this.selectedRecordIdsSignal().has(recordId);
    }

    getRecordDisplayName(recordId: string): string {
        const selectedEntityId = this.selectedEntityIdSignal();
        if (!selectedEntityId) return recordId;
        return this.entityRecordService.getRecordDisplayName(selectedEntityId, recordId);
    }

    get selectedCount(): number {
        return this.selectedRecordIdsSignal().size;
    }
}
