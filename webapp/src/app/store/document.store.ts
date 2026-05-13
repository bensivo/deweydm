import { Injectable, signal } from '@angular/core';

import { Document } from '../models/document.model';

/**
 * Signal-based store for Document state.
 */
@Injectable({ providedIn: 'root' })
export class DocumentStore {
    private documentsSignal = signal<Document[]>([]);
    public documents$ = this.documentsSignal.asReadonly();

    setAll(documents: Document[]): void {
        this.documentsSignal.set(documents);
    }

    getAll(): Document[] {
        return this.documentsSignal();
    }

    getById(id: string): Document | undefined {
        return this.documentsSignal().find(d => d.id === id);
    }

    add(document: Document): void {
        this.documentsSignal.update(docs => [...docs, document]);
    }

    update(id: string, partial: Partial<Document>): void {
        this.documentsSignal.update(docs =>
            docs.map(d => (d.id === id ? { ...d, ...partial } : d))
        );
    }

    remove(id: string): void {
        this.documentsSignal.update(docs => docs.filter(d => d.id !== id));
    }
}
