import { Inject, Injectable } from '@angular/core';

import { View } from '../models/view.model';
import { Filter } from '../models/filter.model';
import { ViewStore } from '../store/view.store';
import { BACKEND_API } from '../backend/backend-api.token';
import { Backend } from '../backend/backend-api.interface';

@Injectable({ providedIn: 'root' })
export class ViewService {
    constructor(
        private viewStore: ViewStore,
        @Inject(BACKEND_API) private backend: Backend,
    ) {}

    get views$() {
        return this.viewStore.views$;
    }

    /**
     * Load all views from the backend and hydrate the store.
     */
    async loadAll(): Promise<void> {
        const views = await this.backend.viewGetAll();
        this.viewStore.setAll(views);
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
     * @returns A promise resolving to the created view
     */
    async saveView(entityId: string, viewName: string, filters: Filter[]): Promise<View> {
        const viewId = this.generateViewId();
        // Deep copy the filters to avoid mutations
        const filtersCopy = filters.map(f => ({ ...f }));
        const view = await this.backend.viewCreate(viewId, viewName, entityId, filtersCopy);
        this.viewStore.createView(view.id, view.name, view.entityId, view.filters);
        return view;
    }

    /**
     * Delete a view by ID.
     *
     * @param viewId - The view ID to delete
     */
    async deleteView(viewId: string): Promise<void> {
        await this.backend.viewDelete(viewId);
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
