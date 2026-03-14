import { Injectable } from '@angular/core';

import { List } from '../models/list.model';
import { ListsStore } from '../store/lists.store';

@Injectable({ providedIn: 'root' })
export class ListService {
    constructor(private listsStore: ListsStore) {}

    get lists$() {
        return this.listsStore.lists$;
    }

    /**
     * Create a new list
     *
     * @param name The name of the list
     * @returns The created list
     */
    createList(name: string): List {
        const list: List = { id: this.generateId(), name, itemIds: [] };
        this.listsStore.createList(list.id, list.name);
        return list;
    }

    /**
     * Rename a list by ID
     *
     * @param id The ID of the list to rename
     * @param newName The new name for the list
     */
    renameList(id: string, newName: string): void {
        this.listsStore.rename(id, newName);
    }

    /**
     * Delete a list by ID
     *
     * @param id The ID of the list to delete
     */
    deleteList(id: string): void {
        this.listsStore.remove(id);
    }

    /**
     * Add record IDs to a list
     *
     * @param listId The ID of the list to update
     * @param recordIds The record IDs to add
     */
    addItemsToList(listId: string, recordIds: string[]): void {
        this.listsStore.addItemIdsToList(listId, recordIds);
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
