import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

import { List } from '../models/list.model';

/**
 * Store for managing multiple lists and their item references
 */
@Injectable({ providedIn: 'root' })
export class ListsStore {
    private listsSignal = signal<List[]>([
        {
            id: 'list1',
            name: 'My First List',
            itemIds: []
        }
    ]);

    public lists$ = this.listsSignal.asReadonly();

    /**
     * Get a specific list by ID
     *
     * @param listId The ID of the list to retrieve
     * @returns The list, or undefined if not found
     */
    getListById(listId: string): List | undefined {
        return this.listsSignal().find(list => list.id === listId);
    }

    /**
     * Update the order of item IDs in a specific list
     *
     * @param listId The ID of the list to update
     * @param itemIds The reordered list of item IDs
     */
    setListItemIds(listId: string, itemIds: string[]): void {
        this.listsSignal.update(lists =>
            lists.map(list =>
                list.id === listId ? { ...list, itemIds } : list
            )
        );
    }

    /**
     * Add item IDs to a list, skipping duplicates
     *
     * @param listId The ID of the list to update
     * @param newItemIds The item IDs to add
     */
    addItemIdsToList(listId: string, newItemIds: string[]): void {
        this.listsSignal.update(lists =>
            lists.map(list => {
                if (list.id !== listId) return list;
                const existingIds = new Set(list.itemIds);
                const itemsToAdd = newItemIds.filter(id => !existingIds.has(id));
                return { ...list, itemIds: [...list.itemIds, ...itemsToAdd] };
            })
        );
    }

    /**
     * Create a new list
     *
     * @param listId The ID for the new list
     * @param name The display name of the list
     */
    createList(listId: string, name: string): void {
        this.listsSignal.update(lists => [...lists, { id: listId, name, itemIds: [] }]);
    }
}
