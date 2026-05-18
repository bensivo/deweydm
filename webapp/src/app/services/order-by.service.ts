import { Injectable, computed, signal } from '@angular/core';

import { OrderBy } from '../models/order-by.model';
import { EntityRecord } from '../models/entity-record.model';
import { Entity, EntityField } from '../models/entity.model';

/**
 * Service for managing multi-column order-by sorting of entity records.
 * Mirrors the structure of FilterService. State is scoped by current entity id.
 */
@Injectable({ providedIn: 'root' })
export class OrderByService {
    private orderByRowsSignal = signal<OrderBy[]>([]);
    private nextOrderByIdSignal = signal<number>(0);
    private currentEntityIdSignal = signal<string>('');

    /**
     * Sets the current entity being sorted. Call this when navigating to a different entity.
     *
     * @param entityId - The entity id to sort for
     */
    setCurrentEntity(entityId: string): void {
        this.currentEntityIdSignal.set(entityId);
    }

    /**
     * Returns order-by rows for the current entity.
     *
     * @returns Array of active order-by rows for the current entity
     */
    getOrderByRows(): OrderBy[] {
        const currentEntityId = this.currentEntityIdSignal();
        return this.orderByRowsSignal().filter(r => r.entityId === currentEntityId);
    }

    /**
     * Returns a computed signal of order-by rows for the current entity.
     *
     * @returns Signal of order-by rows for the current entity
     */
    getOrderByRowsSignal() {
        return computed(() => {
            const currentEntityId = this.currentEntityIdSignal();
            return this.orderByRowsSignal().filter(r => r.entityId === currentEntityId);
        });
    }

    /**
     * Adds a new order-by row for the current entity, defaulting to the first sortable field, ascending.
     *
     * @param fields - The entity fields to pick a default from
     */
    addOrderByRow(fields: EntityField[]): void {
        const sortableFields = fields.filter(f => this.isSortableFieldType(f));
        const defaultFieldId = sortableFields.length > 0 ? sortableFields[0].id : '';

        const newRow: OrderBy = {
            id: `order-by-${this.nextOrderByIdSignal()}`,
            entityId: this.currentEntityIdSignal(),
            fieldId: defaultFieldId,
            order: 'asc'
        };

        this.nextOrderByIdSignal.update(id => id + 1);
        this.orderByRowsSignal.update(rows => [...rows, newRow]);
    }

    /**
     * Removes an order-by row by its id.
     *
     * @param rowId - The order-by row id to remove
     */
    removeOrderByRow(rowId: string): void {
        this.orderByRowsSignal.update(rows => rows.filter(r => r.id !== rowId));
    }

    /**
     * Updates an order-by row with partial updates.
     *
     * @param rowId - The order-by row id to update
     * @param updates - Partial OrderBy properties to apply
     */
    updateOrderByRow(rowId: string, updates: Partial<OrderBy>): void {
        this.orderByRowsSignal.update(rows =>
            rows.map(r => r.id === rowId ? { ...r, ...updates } : r)
        );
    }

    /**
     * Returns true if the field type is sortable (non-reference, non-backlink).
     *
     * @param field - The entity field to check
     * @returns true if the field is sortable
     */
    isSortableFieldType(field: EntityField): boolean {
        return field.type === 'short-text'
            || field.type === 'long-text'
            || field.type === 'number'
            || field.type === 'option';
    }

    /**
     * Sorts records using all order-by rows in sequence (multi-key stable sort).
     * Empty/missing values are sorted last in ascending order.
     *
     * @param records - The records to sort
     * @param orderByRows - The order-by rows to apply in order
     * @param entity - The entity containing field information
     * @returns A new sorted array of records
     */
    applyOrderByToRecords(
        records: EntityRecord[],
        orderByRows: OrderBy[],
        entity: Entity
    ): EntityRecord[] {
        const activeRows = orderByRows.filter(r => !!r.fieldId);
        if (activeRows.length === 0) return records;

        return [...records].sort((a, b) => {
            for (const row of activeRows) {
                const field = entity.fields.find(f => f.id === row.fieldId);
                if (!field) continue;

                const aRaw = a.data[row.fieldId];
                const bRaw = b.data[row.fieldId];
                const aEmpty = aRaw === undefined || aRaw === null || aRaw === '';
                const bEmpty = bRaw === undefined || bRaw === null || bRaw === '';

                // Empty values always sort last, regardless of direction.
                if (aEmpty && bEmpty) continue;
                if (aEmpty) return 1;
                if (bEmpty) return -1;

                const aValue = aRaw as string;
                const bValue = bRaw as string;

                let comparison = 0;
                if (field.type === 'number') {
                    const aNum = parseFloat(aValue);
                    const bNum = parseFloat(bValue);
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        comparison = aNum - bNum;
                    } else {
                        comparison = aValue.localeCompare(bValue);
                    }
                } else if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
                    comparison = Number(aValue) - Number(bValue);
                } else {
                    comparison = aValue.localeCompare(bValue);
                }

                if (comparison !== 0) {
                    return row.order === 'asc' ? comparison : -comparison;
                }
            }
            return 0;
        });
    }
}
