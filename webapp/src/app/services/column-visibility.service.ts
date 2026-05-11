import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ColumnVisibilityService {

    /**
     * Returns the persisted set of visible field IDs for a context, or null if none saved.
     *
     * @param contextType - 'entity-list' or 'view'
     * @param contextId - entityId or viewId
     * @returns Set of visible field IDs, or null if no preference saved
     */
    async load(contextType: 'entity-list' | 'view', contextId: string): Promise<Set<string> | null> {
        const fieldIds: string[] | null = await (window as any).electronApi.columnVisibilityGet(contextType, contextId);
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
        await (window as any).electronApi.columnVisibilitySet(contextType, contextId, Array.from(fieldIds));
    }
}
