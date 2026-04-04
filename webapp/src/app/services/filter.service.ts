import { Injectable, computed, signal } from '@angular/core';

import { Filter, FilterOperator } from '../models/filter.model';
import { EntityRecord } from '../models/entity-record.model';
import { Entity, EntityField, FieldType } from '../models/entity.model';
import { EntityRecordService } from './entity-record.service';

/**
 * Service for managing dynamic filters on entity records.
 * Handles filter state, operations, and applying filters to record sets.
 */
@Injectable({ providedIn: 'root' })
export class FilterService {
    private filtersSignal = signal<Filter[]>([]);
    private nextFilterIdSignal = signal<number>(0);
    private currentEntityIdSignal = signal<string>('');

    /**
     * Computed signal that maps each field type to its valid filter operators.
     */
    filterOperatorsMapSignal = computed(() => ({
        'short-text': ['contains', 'equals', 'not-equals', 'starts-with', 'ends-with'] as FilterOperator[],
        'long-text': ['contains', 'equals', 'not-equals'] as FilterOperator[],
        'number': ['equals', 'not-equals', 'greater-than', 'less-than', 'greater-or-equal', 'less-or-equal'] as FilterOperator[],
        'reference': ['equals', 'not-equals'] as FilterOperator[],
        'reference-list': ['contains', 'not-contains'] as FilterOperator[],
        'option': ['equals', 'not-equals'] as FilterOperator[],
        'backlink': ['is-empty', 'is-not-empty'] as FilterOperator[]
    }));

    constructor(private entityRecordService: EntityRecordService) {}

    /**
     * Sets the current entity being filtered. Call this when navigating to a different entity.
     *
     * @param entityId - The entity id to filter for
     */
    setCurrentEntity(entityId: string): void {
        this.currentEntityIdSignal.set(entityId);
    }

    /**
     * Returns filters for the current entity as a read-only array.
     *
     * @returns Array of active filters for the current entity
     */
    getFilters(): Filter[] {
        const currentEntityId = this.currentEntityIdSignal();
        return this.filtersSignal().filter(f => f.entityId === currentEntityId);
    }

    /**
     * Returns a computed signal containing only filters for the current entity.
     *
     * @returns Signal containing filters for the current entity
     */
    getFiltersSignal() {
        return computed(() => {
            const currentEntityId = this.currentEntityIdSignal();
            return this.filtersSignal().filter(f => f.entityId === currentEntityId);
        });
    }

    /**
     * Adds a new empty filter for the current entity.
     *
     * @param fieldsFromEntity - The entity fields to use for the first field default
     */
    addFilter(fieldsFromEntity: EntityField[]): void {
        const defaultFieldId = fieldsFromEntity.length > 0 ? fieldsFromEntity[0].id : '';
        const defaultOperators = this.filterOperatorsMapSignal()[this.getFieldTypeById(fieldsFromEntity, defaultFieldId) as FieldType];
        const defaultOperator = defaultOperators && defaultOperators.length > 0 ? defaultOperators[0] : 'equals';

        const newFilter: Filter = {
            id: `filter-${this.nextFilterIdSignal()}`,
            entityId: this.currentEntityIdSignal(),
            fieldId: defaultFieldId,
            operator: defaultOperator,
            value: ''
        };

        this.nextFilterIdSignal.update(id => id + 1);
        this.filtersSignal.update(filters => [...filters, newFilter]);
    }

    /**
     * Removes a filter by its id.
     *
     * @param filterId - The filter id to remove
     */
    removeFilter(filterId: string): void {
        this.filtersSignal.update(filters => filters.filter(f => f.id !== filterId));
    }

    /**
     * Updates a filter with partial updates.
     *
     * @param filterId - The filter id to update
     * @param updates - Partial filter object with properties to update
     */
    updateFilter(filterId: string, updates: Partial<Filter>): void {
        this.filtersSignal.update(filters =>
            filters.map(f => f.id === filterId ? { ...f, ...updates } : f)
        );
    }

    /**
     * Gets the valid operators for a given field type.
     *
     * @param fieldType - The field type to get operators for
     * @returns Array of valid operators for the field type
     */
    getFilterOperatorsForFieldType(fieldType: FieldType): FilterOperator[] {
        return this.filterOperatorsMapSignal()[fieldType] || [];
    }

    /**
     * Applies all active filters to an array of records.
     *
     * @param records - The records to filter
     * @param filters - The filters to apply
     * @param entity - The entity containing field information
     * @param entityRecordService - Service for entity record operations
     * @returns Array of records that pass all filters
     */
    applyFiltersToRecords(
        records: EntityRecord[],
        filters: Filter[],
        entity: Entity,
        entityRecordService: EntityRecordService
    ): EntityRecord[] {
        // Filter out incomplete filters (empty value, except for empty operators)
        const activeFilters = filters.filter(filter => {
            const isEmptyOperator = filter.operator === 'is-empty' || filter.operator === 'is-not-empty';
            return isEmptyOperator || (typeof filter.value === 'string' && filter.value.trim() !== '') || (Array.isArray(filter.value) && filter.value.length > 0);
        });

        if (activeFilters.length === 0) return records;

        return records.filter(record => {
            return activeFilters.every(filter => {
                const field = entity.fields.find(f => f.id === filter.fieldId);
                if (!field) return true;
                return this.applyFilter(record, filter, field, entityRecordService);
            });
        });
    }

    /**
     * Checks if a single record passes a single filter.
     *
     * @param record - The record to check
     * @param filter - The filter to apply
     * @param field - The entity field being filtered
     * @param entityRecordService - Service for entity record operations
     * @returns true if record passes the filter, false otherwise
     */
    private applyFilter(
        record: EntityRecord,
        filter: Filter,
        field: EntityField,
        entityRecordService: EntityRecordService
    ): boolean {
        const recordValue = record.data[filter.fieldId] || '';

        // Handle text fields
        if (field.type === 'short-text' || field.type === 'long-text') {
            const lowerRecordValue = recordValue.toLowerCase();
            const lowerFilterValue = (filter.value as string).toLowerCase();

            switch (filter.operator) {
                case 'contains':
                    return lowerRecordValue.includes(lowerFilterValue);
                case 'equals':
                    return lowerRecordValue === lowerFilterValue;
                case 'not-equals':
                    return lowerRecordValue !== lowerFilterValue;
                case 'starts-with':
                    return lowerRecordValue.startsWith(lowerFilterValue);
                case 'ends-with':
                    return lowerRecordValue.endsWith(lowerFilterValue);
                default:
                    return true;
            }
        }

        // Handle number fields
        if (field.type === 'number') {
            const recordNum = parseFloat(recordValue);
            const filterNum = parseFloat(filter.value as string);

            if (isNaN(recordNum) || isNaN(filterNum)) return false;

            switch (filter.operator) {
                case 'equals':
                    return recordNum === filterNum;
                case 'not-equals':
                    return recordNum !== filterNum;
                case 'greater-than':
                    return recordNum > filterNum;
                case 'less-than':
                    return recordNum < filterNum;
                case 'greater-or-equal':
                    return recordNum >= filterNum;
                case 'less-or-equal':
                    return recordNum <= filterNum;
                default:
                    return true;
            }
        }

        // Handle reference fields
        if (field.type === 'reference') {
            switch (filter.operator) {
                case 'equals':
                    return recordValue === filter.value;
                case 'not-equals':
                    return recordValue !== filter.value;
                default:
                    return true;
            }
        }

        // Handle reference-list fields
        if (field.type === 'reference-list') {
            const refIds = recordValue.split(',').map(id => id.trim());
            const filterValue = filter.value as string;

            switch (filter.operator) {
                case 'contains':
                    return refIds.includes(filterValue);
                case 'not-contains':
                    return !refIds.includes(filterValue);
                default:
                    return true;
            }
        }

        // Handle option fields
        if (field.type === 'option') {
            switch (filter.operator) {
                case 'equals':
                    return recordValue === filter.value;
                case 'not-equals':
                    return recordValue !== filter.value;
                default:
                    return true;
            }
        }

        // Handle backlink fields
        if (field.type === 'backlink') {
            if (!field.backlinkSourceEntityId || !field.backlinkSourceFieldId) return true;

            const backlinkedRecords = entityRecordService.getBacklinkedRecords(
                field.backlinkSourceEntityId,
                field.backlinkSourceFieldId,
                record.id
            );

            switch (filter.operator) {
                case 'is-empty':
                    return backlinkedRecords.length === 0;
                case 'is-not-empty':
                    return backlinkedRecords.length > 0;
                default:
                    return true;
            }
        }

        return true;
    }

    /**
     * Helper to get field type by field id from entity fields.
     *
     * @param fieldsFromEntity - Entity fields array
     * @param fieldId - Field id to find
     * @returns The field type, or 'short-text' as fallback
     */
    private getFieldTypeById(fieldsFromEntity: EntityField[], fieldId: string): FieldType {
        const field = fieldsFromEntity.find(f => f.id === fieldId);
        return field ? field.type : 'short-text';
    }
}
