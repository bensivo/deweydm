import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzModalModule } from 'ng-zorro-antd/modal';

import { SortableListComponent } from '../../components/sortable-list/sortable-list.component';
import { EntityReferenceComponent } from '../../components/entity-reference/entity-reference.component';
import { EntityStore } from '../../store/entity.store';
import { EntityRecordStore } from '../../store/entity-record.store';
import { ListsStore } from '../../store/lists.store';
import { EntityField } from '../../models/entity.model';

@Component({
    selector: 'app-lists-page',
    imports: [CommonModule, FormsModule, RouterModule, NzButtonModule, NzCheckboxModule, NzModalModule, SortableListComponent, EntityReferenceComponent],
    templateUrl: './lists.page.html',
    styleUrl: './lists.page.less'
})
export class ListsPageComponent implements OnInit {
    private listIdSignal = signal<string>('');
    list$ = computed(() => {
        const listId = this.listIdSignal();
        return this.listsStore.getListById(listId);
    });

    items$ = computed(() => {
        const itemIds = this.list$()?.itemIds || [];
        return itemIds.map(id => this.entityRecordStore.getById(id)).filter(Boolean);
    });

    // Get unique entity IDs from items in the list
    entityIds$ = computed(() => {
        const items = this.items$();
        const uniqueEntityIds = [...new Set(items.filter(Boolean).map(item => item!.entityId))];
        return uniqueEntityIds;
    });

    // Get all entities used in the list
    entities$ = computed(() => {
        const entityIds = this.entityIds$();
        return entityIds.map(id => this.entityStore.getById(id)).filter((e): e is any => Boolean(e));
    });

    // Get display name fields for each entity
    displayNameFields$ = computed(() => {
        const entities = this.entities$();
        const displayFields = new Map<string, EntityField>();

        entities.forEach(entity => {
            if (entity && entity.fields) {
                const displayFieldId = entity.displayNameFieldId || entity.fields[0]?.id;
                const field = entity.fields.find((f: EntityField) => f.id === displayFieldId);
                if (field && displayFieldId) {
                    displayFields.set(displayFieldId, field);
                }
            }
        });

        return Array.from(displayFields.values());
    });

    // Get all unique fields across all entities (excluding display name fields)
    availableFields$ = computed(() => {
        const entities = this.entities$();
        const displayNameFieldIds = new Set(this.displayNameFields$().map(f => f.id));
        const fieldsMap = new Map<string, EntityField>();

        entities.forEach(entity => {
            if (entity && entity.fields) {
                entity.fields.forEach((field: EntityField) => {
                    // Only include fields that aren't display name fields
                    if (!displayNameFieldIds.has(field.id) && !fieldsMap.has(field.id)) {
                        fieldsMap.set(field.id, field);
                    }
                });
            }
        });

        return Array.from(fieldsMap.values());
    });

    // Track selected column IDs (excludes display name fields)
    selectedColumnIds = signal<string[]>([]);

    // Modal state for column selection
    isColumnModalOpen = signal<boolean>(false);
    pendingSelectedColumnIds = signal<string[]>([]);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private listsStore: ListsStore,
        private entityRecordStore: EntityRecordStore,
        private entityStore: EntityStore
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.listIdSignal.set(params['id']);
            // Initialize selected columns once list is set
            setTimeout(() => {
                const defaultFields = this.availableFields$().slice(0, 2);
                if (this.selectedColumnIds().length === 0 && defaultFields.length > 0) {
                    this.selectedColumnIds.set(defaultFields.map(f => f.id));
                }
            });
        });
    }

    onClickAddItemsButton(): void {
        this.router.navigate(['/lists', this.listIdSignal(), 'add-items']);
    }

    onClickBackButton(): void {
        this.router.navigate(['/']);
    }

    /**
     * Handle reordering of list items via SortableJS
     *
     * @param items The reordered entity records
     */
    onItemsChanged(items: any[]): void {
        const itemIds = items.map(item => item.id);
        this.listsStore.setListItemIds(this.listIdSignal(), itemIds);
    }

    /**
     * Open the column selection modal
     */
    onClickColumnsButton(): void {
        this.pendingSelectedColumnIds.set([...this.selectedColumnIds()]);
        this.isColumnModalOpen.set(true);
    }

    /**
     * Confirm column selection and close modal
     */
    onConfirmColumns(): void {
        this.selectedColumnIds.set(this.pendingSelectedColumnIds());
        this.isColumnModalOpen.set(false);
    }

    /**
     * Cancel and close modal without saving
     */
    onCancelColumns(): void {
        this.isColumnModalOpen.set(false);
    }

    /**
     * Check if a field is selected in the pending selection
     *
     * @param fieldId The field ID
     * @returns True if selected
     */
    isPendingFieldSelected(fieldId: string): boolean {
        return this.pendingSelectedColumnIds().includes(fieldId);
    }

    /**
     * Toggle a pending column selection
     *
     * @param fieldId The field ID to toggle
     */
    onTogglePendingColumn(fieldId: string): void {
        this.pendingSelectedColumnIds.update(ids =>
            ids.includes(fieldId) ? ids.filter(id => id !== fieldId) : [...ids, fieldId]
        );
    }

    /**
     * Toggle a column's visibility
     *
     * @param fieldId The field ID to toggle
     */
    toggleColumn(fieldId: string): void {
        this.selectedColumnIds.update(ids =>
            ids.includes(fieldId) ? ids.filter(id => id !== fieldId) : [...ids, fieldId]
        );
    }

    /**
     * Get field name by ID
     *
     * @param fieldId The field ID
     * @returns The field name
     */
    getFieldName(fieldId: string): string {
        return this.availableFields$().find(f => f.id === fieldId)?.name || fieldId;
    }

    /**
     * Get value from a record for a specific field
     *
     * @param record The entity record
     * @param fieldId The field ID to retrieve
     * @returns The field value
     */
    getFieldValue(record: any, fieldId: string): string {
        return record.data?.[fieldId] || '';
    }

    /**
     * Get priority badge color based on priority level
     *
     * @param priority The priority level
     * @returns Color string for the badge
     */
    getPriorityColor(priority: string): string {
        switch (priority) {
            case 'high':
                return '#ff4d4f';
            case 'medium':
                return '#faad14';
            case 'low':
                return '#52c41a';
            default:
                return '#8c8c8c';
        }
    }
}
