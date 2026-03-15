import { Injectable } from '@angular/core';
import { Entity } from '../models/entity.model';
import { EntityRecord } from '../models/entity-record.model';
import { List } from '../models/list.model';

export interface ExportData {
    version: string;
    exportedAt: string;
    entities: Entity[];
    records: EntityRecord[];
    lists: List[];
}

@Injectable({ providedIn: 'root' })
export class ImportExportService {
    private readonly VERSION = '1.0';

    /**
     * Export all entities, records, and lists as JSON
     */
    exportToJson(entities: Entity[], records: EntityRecord[], lists: List[] = []): ExportData {
        return {
            version: this.VERSION,
            exportedAt: new Date().toISOString(),
            entities,
            records,
            lists
        };
    }

    /**
     * Download exported data as a JSON file
     */
    downloadExport(data: ExportData, filename: string = 'dewey-dm-export.json'): void {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Parse imported JSON file
     */
    parseImportFile(fileContent: string): ExportData {
        try {
            const data = JSON.parse(fileContent);
            this.validateImportData(data);
            return data as ExportData;
        } catch (error) {
            throw new Error('Invalid import file format');
        }
    }

    /**
     * Validate that imported data has required structure
     */
    private validateImportData(data: any): void {
        if (!data.entities || !Array.isArray(data.entities)) {
            throw new Error('Import data missing entities array');
        }
        if (!data.records || !Array.isArray(data.records)) {
            throw new Error('Import data missing records array');
        }
        // Lists are optional for backwards compatibility
        if (data.lists && !Array.isArray(data.lists)) {
            throw new Error('Invalid lists array in import data');
        }
    }

    /**
     * Open file browser and read selected JSON file.
     * Returns a Promise that resolves with the parsed ExportData or rejects on error.
     */
    openImportFileDialog(): Promise<ExportData> {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = (event: any) => {
                const file = event.target.files?.[0];
                if (!file) {
                    reject(new Error('No file selected'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e: any) => {
                    try {
                        const fileContent = e.target.result;
                        const importData = this.parseImportFile(fileContent);
                        resolve(importData);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read file'));
                };
                reader.readAsText(file);
            };

            input.click();
        });
    }
}
