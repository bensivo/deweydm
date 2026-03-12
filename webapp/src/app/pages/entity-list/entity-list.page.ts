import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzModalModule } from 'ng-zorro-antd/modal';

import { EntityService } from '../../services/entity.service';
import { EntityRecordService } from '../../services/entity-record.service';
import { EntityStore } from '../../store/entity.store';
import { EntityField } from '../../models/entity.model';
import { EntityRecord } from '../../models/entity-record.model';
import { generateEntityKey } from '../../services/entity-key.util';
import { EntityReferenceComponent } from '../../components/entity-reference/entity-reference.component';

@Component({
  selector: 'app-entity-list-page',
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzInputModule,
    NzEmptyModule,
    NzTableModule,
    NzCheckboxModule,
    NzModalModule,
    EntityReferenceComponent
  ],
  templateUrl: './entity-list.page.html',
  styleUrl: './entity-list.page.less'
})
export class EntityListPageComponent implements OnInit {
  private entityKeySignal = signal<string>('');
  entity$ = computed(() => {
    const key = this.entityKeySignal();
    const entities = this.entityService.entities$();
    return entities.find(e => generateEntityKey(e.name) === key);
  });

  records$ = computed(() => {
    const entity = this.entity$();
    if (!entity) return [];
    return this.entityRecordService.records$().filter(r => r.entityId === entity.id);
  });

  selectedFieldIdsSignal = signal<Set<string>>(new Set());
  pendingFieldIdsSignal = signal<Set<string>>(new Set());
  isColumnModalOpenSignal = signal<boolean>(false);
  filterTextSignal = signal<string>('');
  sortFieldIdSignal = signal<string>('');
  sortOrderSignal = signal<'asc' | 'desc' | null>(null);

  visibleFields$ = computed(() => {
    const entity = this.entity$();
    if (!entity) return [];
    const selected = this.selectedFieldIdsSignal();
    return entity.fields.filter(f => selected.has(f.id));
  });

  filteredAndSortedRecords$ = computed(() => {
    const records = this.records$();
    const filterText = this.filterTextSignal().toLowerCase();
    const entity = this.entity$();
    const sortFieldId = this.sortFieldIdSignal();
    const sortOrder = this.sortOrderSignal();

    // Filter records
    let filtered = records;
    if (filterText) {
      filtered = records.filter(record => {
        return Object.values(record.data).some(value =>
          value.toLowerCase().includes(filterText)
        );
      });
    }

    // Sort records
    if (sortFieldId && sortOrder !== null) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a.data[sortFieldId] || '';
        const bValue = b.data[sortFieldId] || '';

        let comparison = 0;
        if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
          comparison = Number(aValue) - Number(bValue);
        } else {
          comparison = aValue.localeCompare(bValue);
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entityService: EntityService,
    private entityRecordService: EntityRecordService,
    private entityStore: EntityStore
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const key = params['key'];
      this.entityKeySignal.set(key);
      if (!this.entity$()) {
        this.router.navigate(['/']);
      } else {
        const entity = this.entity$();
        if (entity) {
          this.selectedFieldIdsSignal.set(new Set(entity.fields.map(f => f.id)));
        }
      }
    });
  }

  onClickBackButton(): void {
    this.router.navigate(['/']);
  }

  onClickNewButton(): void {
    const entity = this.entity$();
    if (entity) {
      this.router.navigate(['/entity-create', generateEntityKey(entity.name)]);
    }
  }

  onClickBulkCreateButton(): void {
    const entity = this.entity$();
    if (entity) {
      this.router.navigate(['/entity-bulk-create', generateEntityKey(entity.name)]);
    }
  }

  onClickRecordRow(recordId: string): void {
    const entity = this.entity$();
    if (entity) {
      this.router.navigate(['/entity', generateEntityKey(entity.name), recordId]);
    }
  }

  onClickColumnsButton(): void {
    this.pendingFieldIdsSignal.set(new Set(this.selectedFieldIdsSignal()));
    this.isColumnModalOpenSignal.set(true);
  }

  onConfirmColumns(): void {
    this.selectedFieldIdsSignal.set(new Set(this.pendingFieldIdsSignal()));
    this.isColumnModalOpenSignal.set(false);
  }

  onCancelColumns(): void {
    this.isColumnModalOpenSignal.set(false);
  }

  onTogglePendingColumn(fieldId: string, checked: boolean): void {
    const pending = new Set(this.pendingFieldIdsSignal());
    if (checked) {
      pending.add(fieldId);
    } else {
      pending.delete(fieldId);
    }
    this.pendingFieldIdsSignal.set(pending);
  }

  isPendingFieldVisible(fieldId: string): boolean {
    return this.pendingFieldIdsSignal().has(fieldId);
  }

  onFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterTextSignal.set(input.value);
  }

  onColumnHeaderClick(fieldId: string): void {
    const currentFieldId = this.sortFieldIdSignal();
    const currentOrder = this.sortOrderSignal();

    if (currentFieldId === fieldId) {
      // Cycle through: asc -> desc -> null
      if (currentOrder === 'asc') {
        this.sortOrderSignal.set('desc');
      } else if (currentOrder === 'desc') {
        this.sortFieldIdSignal.set('');
        this.sortOrderSignal.set(null);
      } else {
        this.sortFieldIdSignal.set(fieldId);
        this.sortOrderSignal.set('asc');
      }
    } else {
      // Sort by new field in ascending order
      this.sortFieldIdSignal.set(fieldId);
      this.sortOrderSignal.set('asc');
    }
  }

  getColumnSortOrder(fieldId: string): 'ascend' | 'descend' | null {
    if (this.sortFieldIdSignal() !== fieldId) return null;
    return this.sortOrderSignal() === 'asc' ? 'ascend' : 'descend';
  }

  getFieldDisplayValue(field: EntityField, record: EntityRecord): string {
    if (field.type === 'reference' && record.data[field.id]) {
      return this.entityRecordService.getRecordDisplayName(field.referenceEntityId!, record.data[field.id]);
    }
    if (field.type === 'reference-list' && record.data[field.id]) {
      const ids = record.data[field.id].split(',');
      const names = ids.map(id => this.entityRecordService.getRecordDisplayName(field.referenceEntityId!, id));
      return names.join(', ');
    }
    return record.data[field.id] || '—';
  }

  isReferenceField(field: EntityField): boolean {
    return field.type === 'reference';
  }

  isReferenceListField(field: EntityField): boolean {
    return field.type === 'reference-list';
  }

  getRefListItems(field: EntityField, record: EntityRecord): { label: string; id: string; routeKey: string | null }[] {
    const value = record.data[field.id];
    if (!value) return [];
    const ids = value.split(',');
    return ids.map(id => ({
      id,
      label: this.entityRecordService.getRecordDisplayName(field.referenceEntityId!, id),
      routeKey: this.getReferencedEntityRouteKey(field)
    }));
  }

  getReferencedEntityRouteKey(field: EntityField): string | null {
    if (!field.referenceEntityId) return null;
    const entity = this.entityStore.getById(field.referenceEntityId);
    if (!entity) return null;
    return generateEntityKey(entity.name);
  }
}
