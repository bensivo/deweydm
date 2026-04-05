import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

import { View } from '../models/view.model';
import { Filter } from '../models/filter.model';

/**
 * Store for managing saved views (filtered entity lists).
 */
@Injectable({ providedIn: 'root' })
export class ViewStore {
    private viewsSignal = signal<View[]>([]);

    public views$ = this.viewsSignal.asReadonly();

    /**
     * Get a specific view by ID.
     *
     * @param viewId - The ID of the view to retrieve
     * @returns The view, or undefined if not found
     */
    getViewById(viewId: string): View | undefined {
        return this.viewsSignal().find(view => view.id === viewId);
    }

    /**
     * Get all views for a specific entity.
     *
     * @param entityId - The entity ID to filter by
     * @returns Array of views for the entity
     */
    getViewsByEntityId(entityId: string): View[] {
        return this.viewsSignal().filter(view => view.entityId === entityId);
    }

    /**
     * Create a new view.
     *
     * @param id - The unique ID for the view
     * @param name - The display name for the view
     * @param entityId - The entity this view is for
     * @param filters - The filters to apply in this view
     */
    createView(id: string, name: string, entityId: string, filters: Filter[]): void {
        this.viewsSignal.update(views => [...views, { id, name, entityId, filters }]);
    }

    /**
     * Update a view with partial updates.
     *
     * @param viewId - The view ID to update
     * @param updates - Partial view object with properties to update
     */
    updateView(viewId: string, updates: Partial<View>): void {
        this.viewsSignal.update(views =>
            views.map(view => view.id === viewId ? { ...view, ...updates } : view)
        );
    }

    /**
     * Delete a view by ID.
     *
     * @param viewId - The view ID to delete
     */
    deleteView(viewId: string): void {
        this.viewsSignal.update(views => views.filter(view => view.id !== viewId));
    }

    /**
     * Get all views.
     *
     * @returns Array of all views
     */
    getAll(): View[] {
        return this.viewsSignal();
    }
}
