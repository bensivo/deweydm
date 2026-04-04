export type FilterOperator =
    | 'contains' | 'not-contains' | 'equals' | 'not-equals' | 'starts-with' | 'ends-with'
    | 'greater-than' | 'less-than' | 'greater-or-equal' | 'less-or-equal'
    | 'is-empty' | 'is-not-empty';

export interface Filter {
    id: string;
    fieldId: string;
    operator: FilterOperator;
    value: string | string[];
}
