import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FieldType } from '../../models/entity.model';
import { generateEntityKey } from '../../services/entity-key.util';
import { EntityService } from '../../services/entity.service';

@Component({
  selector: 'app-entity-config-page',
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzModalModule,
    NzEmptyModule,
    NzIconModule
  ],
  templateUrl: './entity-config.page.html',
  styleUrl: './entity-config.page.less'
})
export class EntityConfigPageComponent implements OnInit {
  private entityKeySignal = signal<string>('');
  entity$ = computed(() => {
    const key = this.entityKeySignal();
    const entities = this.entityService.entities$();
    return entities.find(e => generateEntityKey(e.name) === key);
  });

  showAddFieldModal = signal(false);

  newFieldName = '';
  newFieldType: FieldType = 'short-text';
  newFieldReferenceEntityId = '';
  newFieldBacklinkSourceEntityIdSignal = signal<string>('');
  newFieldBacklinkSourceFieldIdSignal = signal<string>('');
  newFieldOptionValuesSignal = signal<string[]>([]);
  newOptionInputValue = '';

  fieldTypeOptions: { label: string; value: FieldType }[] = [
    { label: 'Short Text', value: 'short-text' },
    { label: 'Long Text', value: 'long-text' },
    { label: 'Number', value: 'number' },
    { label: 'Reference', value: 'reference' },
    { label: 'Reference List', value: 'reference-list' },
    { label: 'Backlink', value: 'backlink' },
    { label: 'Option', value: 'option' },
  ];

  referencableEntities$ = computed(() => {
    const entity = this.entity$();
    if (!entity) return [];
    return this.entityService.entities$().filter(e => e.id !== entity.id);
  });

  backlinkSourceFields$ = computed(() => {
    const sourceEntityId = this.newFieldBacklinkSourceEntityIdSignal();
    if (!sourceEntityId) return [];
    const currentEntity = this.entity$();
    if (!currentEntity) return [];
    const sourceEntity = this.entityService.getById(sourceEntityId);
    if (!sourceEntity) return [];
    // Return reference fields in the source entity that point to the current entity
    return sourceEntity.fields.filter(
        f => (f.type === 'reference' || f.type === 'reference-list') && f.referenceEntityId === currentEntity.id
    );
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entityService: EntityService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const key = params['key'];
      this.entityKeySignal.set(key);
      if (!this.entity$()) {
        this.router.navigate(['/workspace-config']);
      }
    });
  }

  onClickBackButton(): void {
    this.router.navigate(['/workspace-config']);
  }

  onClickAddFieldButton(): void {
    this.newFieldName = '';
    this.newFieldType = 'short-text';
    this.newFieldReferenceEntityId = '';
    this.newFieldBacklinkSourceEntityIdSignal.set('');
    this.newFieldBacklinkSourceFieldIdSignal.set('');
    this.newFieldOptionValuesSignal.set([]);
    this.showAddFieldModal.set(true);
  }

  onClickConfirmAddFieldButton(): void {
    const entity = this.entity$();
    if (!entity || !this.newFieldName) {
      return;
    }
    const referenceEntityId = (this.newFieldType === 'reference' || this.newFieldType === 'reference-list') ? this.newFieldReferenceEntityId : undefined;
    const backlinkSourceEntityId = this.newFieldType === 'backlink' ? this.newFieldBacklinkSourceEntityIdSignal() : undefined;
    const backlinkSourceFieldId = this.newFieldType === 'backlink' ? this.newFieldBacklinkSourceFieldIdSignal() : undefined;
    const optionValues = this.newFieldType === 'option' ? this.newFieldOptionValuesSignal() : undefined;
    this.entityService.addField(
        entity.id,
        this.newFieldName,
        this.newFieldType,
        referenceEntityId,
        backlinkSourceEntityId,
        backlinkSourceFieldId,
        optionValues
    );
    this.showAddFieldModal.set(false);
  }

  onClickMoveFieldUpButton(fieldId: string): void {
    const entity = this.entity$();
    if (!entity) return;
    this.entityService.moveField(entity.id, fieldId, 'up');
  }

  onClickMoveFieldDownButton(fieldId: string): void {
    const entity = this.entity$();
    if (!entity) return;
    this.entityService.moveField(entity.id, fieldId, 'down');
  }

  onClickRemoveFieldButton(fieldId: string): void {
    const entity = this.entity$();
    if (!entity) {
      return;
    }
    this.entityService.removeField(entity.id, fieldId);
  }

  getFieldTypeLabel(type: FieldType): string {
    return this.fieldTypeOptions.find(opt => opt.value === type)?.label || type;
  }

  onChangeDisplayNameField(fieldId: string): void {
    const entity = this.entity$();
    if (!entity) return;
    this.entityService.setDisplayNameField(entity.id, fieldId);
  }

  onClickAddOptionValue(): void {
    const value = this.newOptionInputValue.trim();
    if (value && !this.newFieldOptionValuesSignal().includes(value)) {
      this.newFieldOptionValuesSignal.update(current => [...current, value]);
      this.newOptionInputValue = '';
    }
  }

  onClickRemoveOptionValue(index: number): void {
    this.newFieldOptionValuesSignal.update(current => current.filter((_, i) => i !== index));
  }
}
