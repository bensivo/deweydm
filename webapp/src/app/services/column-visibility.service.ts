import { Inject, Injectable } from '@angular/core';

import { BACKEND_API } from '../backend/backend-api.token';
import { Backend } from '../backend/backend-api.interface';

@Injectable({ providedIn: 'root' })
export class ColumnVisibilityService {

    constructor(@Inject(BACKEND_API) private backend: Backend) {}

    /**
     * Returns the persisted set of visible field IDs for a context, or null if none saved.
     *
     * @param contextType - 'entity-list' or 'view'
     * @param contextId - entityId or viewId
     * @returns Set of visible field IDs, or null if no preference saved
     */
    async load(contextType: 'entity-list' | 'view', contextId: string): Promise<Set<string> | null> {
        const fieldIds: string[] | null = await this.backend.columnVisibilityGet(contextType, contextId);
        if (!fieldIds) return null;
        return new Set<string>(fieldIds);
    }

    /**
     * Persists the visible field IDs for a context.
     *
     * @param contextType - 'entity-list' or 'view'
     * @param contextId - entityId or viewId
     * @param fieldIds - The field IDs currently visible
     */
    async save(contextType: 'entity-list' | 'view', contextId: string, fieldIds: Set<string>): Promise<void> {
        await this.backend.columnVisibilitySet(contextType, contextId, Array.from(fieldIds));
    }
}
