import { effect, Injectable, signal } from '@angular/core';
import { Entity } from '../models/entity.model';

@Injectable({ providedIn: 'root' })
export class EntityStore {
  private entitiesSignal = signal<Entity[]>([]);
  public entities$ = this.entitiesSignal.asReadonly();

  constructor() {
    effect(() => {
      console.log('Entities updated:', this.entitiesSignal());
    })
  }


  setAll(entities: Entity[]): void {
    this.entitiesSignal.set(entities);
  }

  getAll(): Entity[] {
    return this.entitiesSignal();
  }

  getById(id: string): Entity | undefined {
    return this.entitiesSignal().find(e => e.id === id);
  }

  add(entity: Entity): void {
    this.entitiesSignal.update(entities => [...entities, entity]);
  }

  update(id: string, entity: Partial<Entity>): void {
    this.entitiesSignal.update(entities =>
      entities.map(e => (e.id === id ? { ...e, ...entity } : e))
    );
  }

  remove(id: string): void {
    this.entitiesSignal.update(entities => entities.filter(e => e.id !== id));
  }
}
