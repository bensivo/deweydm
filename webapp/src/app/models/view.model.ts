import { Filter } from './filter.model';

/**
 * Represents a saved set of filters tied to a specific entity.
 * Views are accessible from the sidebar and provide pre-filtered entity lists.
 */
export interface View {
    id: string;
    name: string;
    entityId: string;
    filters: Filter[];
}
