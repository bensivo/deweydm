import { Injectable } from '@angular/core';

import { EntityService } from './entity.service';
import { EntityRecordService } from './entity-record.service';
import { generateEntityKey } from './entity-key.util';
import { SearchResult, SearchStore } from '../store/search.store';

/**
 * Service for searching records across all entities by display name
 */
@Injectable({ providedIn: 'root' })
export class SearchService {
    constructor(
        private entityService: EntityService,
        private entityRecordService: EntityRecordService,
        private searchStore: SearchStore
    ) {}

    /**
     * Search records across all entities by display name.
     * Performs case-insensitive substring matching on the display name.
     *
     * @param query The search query string
     * @returns Array of search results
     */
    searchRecords(query: string): SearchResult[] {
        if (!query || query.trim() === '') {
            return [];
        }

        const lowerQuery = query.toLowerCase();
        const results: SearchResult[] = [];

        const entities = this.entityService.getAll();

        for (const entity of entities) {
            const records = this.entityRecordService.getByEntityId(entity.id);

            for (const record of records) {
                const displayName = this.entityRecordService.getRecordDisplayName(entity.id, record.id);
                const lowerDisplayName = displayName.toLowerCase();

                if (lowerDisplayName.includes(lowerQuery)) {
                    results.push({
                        recordId: record.id,
                        recordName: displayName,
                        entityId: entity.id,
                        entityName: entity.name,
                        entityKey: generateEntityKey(entity.name)
                    });
                }
            }
        }

        return results;
    }

    /**
     * Perform a search and update the search store with results
     *
     * @param query The search query string
     */
    performSearch(query: string): void {
        const results = this.searchRecords(query);
        this.searchStore.setResults(query, results);
    }

    /**
     * Clear search results
     */
    clearSearch(): void {
        this.searchStore.clearResults();
    }
}
