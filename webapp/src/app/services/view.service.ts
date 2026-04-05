import { Injectable, computed } from '@angular/core';

import { View } from '../models/view.model';
import { Filter } from '../models/filter.model';
import { ViewStore } from '../store/view.store';

@Injectable({ providedIn: 'root' })
export class ViewService {
    constructor(private viewStore: ViewStore) {}

    get views$() {
        return this.viewStore.views$;
    }

    /**
     * Get all views for a specific entity.
     *
     * @param entityId - The entity ID to filter by
     * @returns Array of views for the entity
     */
    getViewsByEntityId(entityId: string): View[] {
        return this.viewStore.getViewsByEntityId(entityId);
    }

    /**
     * Get a view by ID.
     *
     * @param viewId - The view ID to retrieve
     * @returns The view, or undefined if not found
     */
    getViewById(viewId: string): View | undefined {
        return this.viewStore.getViewById(viewId);
    }

    /**
     * Save a new view with current filters.
     *
     * @param entityId - The entity this view is for
     * @param viewName - The name for the view
     * @param filters - The filters to save in this view
     * @returns The created view
     */
    saveView(entityId: string, viewName: string, filters: Filter[]): View {
        const viewId = this.generateViewId();
        // Deep copy the filters to avoid mutations
        const filtersCopy = filters.map(f => ({ ...f }));
        const view: View = { id: viewId, name: viewName, entityId, filters: filtersCopy };
        this.viewStore.createView(viewId, viewName, entityId, filtersCopy);
        return view;
    }

    /**
     * Delete a view by ID.
     *
     * @param viewId - The view ID to delete
     */
    deleteView(viewId: string): void {
        this.viewStore.deleteView(viewId);
    }

    /**
     * Generate a unique view ID.
     *
     * @returns A unique ID string
     */
    private generateViewId(): string {
        return `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
