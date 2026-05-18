export type SortOrder = 'asc' | 'desc';

/**
 * Represents a single order-by row for sorting an entity's records.
 */
export interface OrderBy {
    id: string;
    entityId: string;
    fieldId: string;
    order: SortOrder;
}
