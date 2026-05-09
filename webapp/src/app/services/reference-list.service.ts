import { Injectable } from '@angular/core';

/**
 * Service for working with reference-list field values.
 *
 * Reference-list fields store their value as a comma-separated string of record IDs.
 * NG-Zorro's nz-select multi-mode binds to a string[], so callers need to parse
 * and stringify between the two representations.
 */
@Injectable({ providedIn: 'root' })
export class ReferenceListService {
    // Memoize parsed arrays by source string so callers get a referentially stable
    // array back for the same input. Without this, [ngModel] on nz-select sees a new
    // array on every change-detection cycle and triggers an infinite loop.
    private parseCache = new Map<string, string[]>();

    private static readonly EMPTY: string[] = [];

    /**
     * Parse a CSV reference-list value into an array of record IDs.
     *
     * @param value - Comma-separated record IDs, or an empty string
     * @returns Array of record IDs (referentially stable for repeated calls with the same input)
     */
    parseRefList(value: string): string[] {
        if (!value) return ReferenceListService.EMPTY;
        let cached = this.parseCache.get(value);
        if (!cached) {
            cached = value.split(',');
            this.parseCache.set(value, cached);
        }
        return cached;
    }

    /**
     * Serialize an array of record IDs into the CSV format used for reference-list storage.
     *
     * @param values - Array of record IDs
     * @returns Comma-separated string
     */
    stringifyRefList(values: string[]): string {
        return values.join(',');
    }
}
