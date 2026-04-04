export type FilterOperator =
    | 'contains' | 'not-contains' | 'equals' | 'not-equals' | 'starts-with' | 'ends-with'
    | 'greater-than' | 'less-than' | 'greater-or-equal' | 'less-or-equal'
    | 'is-empty' | 'is-not-empty';

/**
 * Represents a single filter condition for an entity's records.
 */
export interface Filter {
    id: string;
    entityId: string;
    fieldId: string;
    operator: FilterOperator;
    value: string | string[];
}
