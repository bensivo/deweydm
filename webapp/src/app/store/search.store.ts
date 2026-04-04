import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

/**
 * Store for managing search query and results
 */
@Injectable({ providedIn: 'root' })
export class SearchStore {
    private searchQuerySignal = signal<string>('');
    private searchResultsSignal = signal<SearchResult[]>([]);

    public searchQuery$ = this.searchQuerySignal.asReadonly();
    public searchResults$ = this.searchResultsSignal.asReadonly();

    /**
     * Update the search query and results
     *
     * @param query The search query string
     * @param results The array of search results
     */
    setResults(query: string, results: SearchResult[]): void {
        this.searchQuerySignal.set(query);
        this.searchResultsSignal.set(results);
    }

    /**
     * Clear search results and query
     */
    clearResults(): void {
        this.searchQuerySignal.set('');
        this.searchResultsSignal.set([]);
    }
}

export interface SearchResult {
    recordId: string;
    recordName: string;
    entityId: string;
    entityName: string;
    entityKey: string;
}
