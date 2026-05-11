import { Injectable, signal } from '@angular/core';

/**
 * Stores transient pagination UI state for the entity-list page, and view page.
 * State is kept in memory only and is not persisted across app reloads.
 */
@Injectable({ providedIn: 'root' })
export class EntityListPaginationStore {

    // Stores the current page for the given entity key
    // For the entity-list page, the key is the entity id. For the view page, the key is the view id.
    private pageIndexByEntityKeySignal = signal<Record<string, number>>({});
    public pageIndexByEntityKey$ = this.pageIndexByEntityKeySignal.asReadonly();

    getPageIndex(entityKey: string): number {
        return this.pageIndexByEntityKeySignal()[entityKey] ?? 1;
    }

    setPageIndex(entityKey: string, pageIndex: number): void {
        this.pageIndexByEntityKeySignal.update(state => ({
            ...state,
            [entityKey]: pageIndex,
        }));
    }
}
