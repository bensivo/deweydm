import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { EntityService } from '../../services/entity.service';
import { EntityRecordService } from '../../services/entity-record.service';
import { FilterService } from '../../services/filter.service';
import { ListService } from '../../services/list.service';
import { EntityField } from '../../models/entity.model';
import { EntityRecord } from '../../models/entity-record.model';
import { FilterOperator } from '../../models/filter.model';
import { generateEntityKey } from '../../services/entity-key.util';
import { EntityReferenceComponent } from '../../components/entity-reference/entity-reference.component';
import { ModalState } from '../../utils/modal-state.util';

@Component({
  selector: 'app-entity-list-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzButtonModule,
    NzInputModule,
    NzEmptyModule,
    NzTableModule,
    NzCheckboxModule,
    NzModalModule,
    NzDropDownModule,
    NzMenuModule,
    NzIconModule,
    NzSelectModule,
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

  columnModalState = new ModalState<Set<string>>(new Set(), (set) => new Set(set));
  filterTextSignal = signal<string>('');
  sortFieldIdSignal = signal<string>('');
  sortOrderSignal = signal<'asc' | 'desc' | null>(null);
  isFiltersVisibleSignal = signal<boolean>(false);

  // Multi-select and add-to-list
  selectedRecordIdsSignal = signal<Set<string>>(new Set());
  lastSelectedRecordIdSignal = signal<string>('');
  isShiftHeldSignal = signal<boolean>(false);

  visibleFields$ = computed(() => {
    const entity = this.entity$();
    if (!entity) return [];
    const selected = this.columnModalState.committed$();
    return entity.fields.filter(f => selected.has(f.id));
  });

  lists$ = computed(() => this.listService.lists$());

  filteredAndSortedRecords$ = computed(() => {
    const records = this.records$();
    const filterText = this.filterTextSignal().toLowerCase();
    const entity = this.entity$();
    const sortFieldId = this.sortFieldIdSignal();
    const sortOrder = this.sortOrderSignal();
    const filters = this.filterService.getFilters();

    // Apply dynamic filters
    let filtered = this.filterService.applyFiltersToRecords(
        records,
        filters,
        entity!,
        this.entityRecordService
    );

    // Apply text filter
    if (filterText) {
      filtered = filtered.filter(record => {
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
    public filterService: FilterService,
    private listService: ListService
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
          const allFieldIds = new Set(entity.fields.map(f => f.id));
          this.columnModalState.committed$.set(allFieldIds);
        }
      }
    });

    // Track shift key state
    window.addEventListener('keydown', (event) => {
      if (event.shiftKey) {
        this.isShiftHeldSignal.set(true);
      }
    });
    window.addEventListener('keyup', (event) => {
      if (event.key === 'Shift') {
        this.isShiftHeldSignal.set(false);
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
    this.columnModalState.open();
  }

  onConfirmColumns(): void {
    this.columnModalState.confirm();
  }

  onCancelColumns(): void {
    this.columnModalState.cancel();
  }

  onTogglePendingColumn(fieldId: string, checked: boolean): void {
    const pending = new Set(this.columnModalState.pending$());
    if (checked) {
      pending.add(fieldId);
    } else {
      pending.delete(fieldId);
    }
    this.columnModalState.pending$.set(pending);
  }

  isPendingFieldVisible(fieldId: string): boolean {
    return this.columnModalState.pending$().has(fieldId);
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
    return this.entityRecordService.getRefListItems(value, field).map(record => ({
      id: record.id,
      label: this.entityRecordService.getRecordDisplayName(field.referenceEntityId!, record.id),
      routeKey: this.entityRecordService.getReferenceRouteKey(field)
    }));
  }

  getReferencedEntityRouteKey(field: EntityField): string | null {
    return this.entityRecordService.getReferenceRouteKey(field);
  }

  onToggleRecordSelection(recordId: string, checked: boolean): void {
    const records = this.filteredAndSortedRecords$();
    const currentIndex = records.findIndex(r => r.id === recordId);
    const isShiftHeld = this.isShiftHeldSignal();

    // If shift is held and we have a last selected, do range selection
    if (isShiftHeld && this.lastSelectedRecordIdSignal()) {
      const lastIndex = records.findIndex(r => r.id === this.lastSelectedRecordIdSignal());
      const [start, end] = currentIndex < lastIndex ? [currentIndex, lastIndex] : [lastIndex, currentIndex];
      const selected = new Set(this.selectedRecordIdsSignal());

      // Select all records in the range (inclusive)
      for (let i = start; i <= end; i++) {
        selected.add(records[i].id);
      }
      this.selectedRecordIdsSignal.set(selected);
    } else {
      // Normal toggle
      const selected = new Set(this.selectedRecordIdsSignal());
      if (checked) {
        selected.add(recordId);
      } else {
        selected.delete(recordId);
      }
      this.selectedRecordIdsSignal.set(selected);
    }

    this.lastSelectedRecordIdSignal.set(recordId);
  }

  isRecordSelected(recordId: string): boolean {
    return this.selectedRecordIdsSignal().has(recordId);
  }

  onAddSelectedItemsToList(listId: string): void {
    const recordIds = Array.from(this.selectedRecordIdsSignal());
    if (recordIds.length > 0) {
      this.listService.addItemsToList(listId, recordIds);
      this.selectedRecordIdsSignal.set(new Set());
    }
  }

  // Filter-related methods
  getFiltersSignal() {
    return this.filterService.getFiltersSignal();
  }

  onClickFilterToggleButton(): void {
    this.isFiltersVisibleSignal.update(visible => !visible);
  }

  onClickAddFilterButton(): void {
    const entity = this.entity$();
    if (entity) {
      this.filterService.addFilter(entity.fields);
    }
  }

  onClickRemoveFilterButton(filterId: string): void {
    this.filterService.removeFilter(filterId);
  }

  onFilterFieldChange(filterId: string, newFieldId: string): void {
    const entity = this.entity$();
    if (entity) {
      const field = entity.fields.find(f => f.id === newFieldId);
      if (field) {
        const validOperators = this.filterService.getFilterOperatorsForFieldType(field.type);
        const defaultOperator = validOperators.length > 0 ? validOperators[0] : 'equals';
        this.filterService.updateFilter(filterId, {
            fieldId: newFieldId,
            operator: defaultOperator,
            value: ''
        });
      }
    }
  }

  onFilterOperatorChange(filterId: string, newOperator: FilterOperator): void {
    this.filterService.updateFilter(filterId, { operator: newOperator });
  }

  onFilterValueChange(filterId: string, newValue: string | string[]): void {
    this.filterService.updateFilter(filterId, { value: newValue });
  }

  getFieldById(fieldId: string): EntityField | undefined {
    const entity = this.entity$();
    return entity?.fields.find(f => f.id === fieldId);
  }

  getOperatorLabel(operator: FilterOperator): string {
    const operatorLabels: Record<FilterOperator, string> = {
        'contains': 'Contains',
        'equals': 'Equals',
        'not-equals': 'Not Equals',
        'starts-with': 'Starts With',
        'ends-with': 'Ends With',
        'greater-than': 'Greater Than',
        'less-than': 'Less Than',
        'greater-or-equal': 'Greater or Equal',
        'less-or-equal': 'Less or Equal',
        'is-empty': 'Is Empty',
        'is-not-empty': 'Is Not Empty'
    };
    return operatorLabels[operator] || operator;
  }

  isTextFieldType(fieldType: string): boolean {
    return fieldType === 'short-text' || fieldType === 'long-text';
  }

  isReferenceFieldType(fieldType: string): boolean {
    return fieldType === 'reference' || fieldType === 'reference-list';
  }

  isEmptyOperator(operator: FilterOperator): boolean {
    return operator === 'is-empty' || operator === 'is-not-empty';
  }

  getReferenceFilterOptions(field: EntityField): { id: string; label: string }[] {
    const options = this.entityRecordService.getReferenceOptions(field);
    return options.map(opt => ({
        id: opt.recordId,
        label: opt.recordName
    }));
  }
}
