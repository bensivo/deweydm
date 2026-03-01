import { effect, Injectable, signal } from '@angular/core';

import { EntityRecord } from '../models/entity-record.model';

@Injectable({ providedIn: 'root' })
export class EntityRecordStore {
    private recordsSignal = signal<EntityRecord[]>([]);
    public records$ = this.recordsSignal.asReadonly();

    constructor() {
        effect(() => {
            console.log('Entity records updated:', this.recordsSignal());
        })
    }

    getAll(): EntityRecord[] {
        return this.recordsSignal();
    }

    getById(id: string): EntityRecord | undefined {
        return this.recordsSignal().find(r => r.id === id);
    }

    getByEntityId(entityId: string): EntityRecord[] {
        return this.recordsSignal().filter(r => r.entityId === entityId);
    }

    add(record: EntityRecord): void {
        this.recordsSignal.update(records => [...records, record]);
    }

    update(id: string, partial: Partial<EntityRecord>): void {
        this.recordsSignal.update(records =>
            records.map(r => (r.id === id ? { ...r, ...partial } : r))
        );
    }

    remove(id: string): void {
        this.recordsSignal.update(records => records.filter(r => r.id !== id));
    }
}
