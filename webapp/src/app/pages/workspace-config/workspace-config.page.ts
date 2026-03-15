import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { EntityService } from '../../services/entity.service';
import { generateEntityKey } from '../../services/entity-key.util';
import { TemplateService, TemplateType } from '../../services/template.service';
import { EntityStore } from '../../store/entity.store';
import { EntityRecordStore } from '../../store/entity-record.store';
import { ImportExportService } from '../../services/import-export.service';
import { ListService } from '../../services/list.service';
import { ListsStore } from '../../store/lists.store';

@Component({
  selector: 'app-workspace-config-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzEmptyModule,
    NzRadioModule
  ],
  templateUrl: './workspace-config.page.html',
  styleUrl: './workspace-config.page.less'
})
export class WorkspaceConfigPageComponent {
  showCreateEntityModal = signal(false);
  showTemplateSelectionModal = signal(false);
  showTemplateConfirmModal = signal(false);

  newEntityName = '';
  newEntityPluralName = '';

  selectedTemplate: TemplateType | null = null;
  availableTemplates = signal<Array<{ id: TemplateType; name: string; description: string }>>([]);

  constructor(
    private entityService: EntityService,
    private templateService: TemplateService,
    private entityStore: EntityStore,
    private entityRecordStore: EntityRecordStore,
    private importExportService: ImportExportService,
    private listService: ListService,
    private listsStore: ListsStore
  ) {
    this.availableTemplates.set(this.templateService.getAvailableTemplates());
  }

  get entities$() {
    return this.entityService.entities$;
  }

  get lists$() {
    return this.listService.lists$;
  }

  onClickAddEntityButton(): void {
    this.newEntityName = '';
    this.newEntityPluralName = '';
    this.showCreateEntityModal.set(true);
  }

  onClickCreateEntityButton(): void {
    if (!this.newEntityName || !this.newEntityPluralName) {
      return;
    }
    this.entityService.createEntity(this.newEntityName, this.newEntityPluralName);
    this.showCreateEntityModal.set(false);
  }

  onClickDeleteEntityButton(entityId: string): void {
    this.entityService.deleteEntity(entityId);
  }

  getEntityKey(name: string): string {
    return generateEntityKey(name);
  }

  getEntityKeyPreview(): string {
    return generateEntityKey(this.newEntityName);
  }

  onClickLoadTemplateButton(): void {
    this.selectedTemplate = null;
    this.showTemplateSelectionModal.set(true);
  }

  onSelectTemplate(templateId: TemplateType): void {
    this.selectedTemplate = templateId;
  }

  onClickConfirmTemplateSelection(): void {
    if (!this.selectedTemplate) return;
    this.showTemplateSelectionModal.set(false);
    this.showTemplateConfirmModal.set(true);
  }

  onClickCancelTemplateSelection(): void {
    this.showTemplateSelectionModal.set(false);
  }

  onClickConfirmTemplateLoad(): void {
    if (!this.selectedTemplate) return;

    const template = this.templateService.getTemplate(this.selectedTemplate);

    // Clear existing data
    this.entityStore.getAll().forEach(entity => {
      this.entityService.deleteEntity(entity.id);
    });
    this.entityRecordStore.getAll().forEach(record => {
      this.entityRecordStore.remove(record.id);
    });
    this.listsStore.getAll().forEach(list => {
      this.listsStore.remove(list.id);
    });

    // Load template data
    template.entities.forEach(entity => {
      this.entityStore.add(entity);
    });

    template.records.forEach(record => {
      this.entityRecordStore.add(record);
    });

    template.lists.forEach(list => {
      this.listsStore.add(list);
    });

    this.showTemplateConfirmModal.set(false);
  }

  onClickCancelTemplateConfirm(): void {
    this.showTemplateConfirmModal.set(false);
  }

  onClickExportButton(): void {
    const entities = this.entityStore.getAll();
    const records = this.entityRecordStore.getAll();
    const lists = this.listsStore.getAll();
    const exportData = this.importExportService.exportToJson(entities, records, lists);
    const timestamp = new Date().toISOString().split('T')[0];
    this.importExportService.downloadExport(exportData, `dewey-dm-export-${timestamp}.json`);
  }

  onClickImportButton(): void {
    this.importExportService.openImportFileDialog()
        .then(importData => {
            // Clear existing data
            this.entityStore.getAll().forEach(entity => {
                this.entityService.deleteEntity(entity.id);
            });
            this.entityRecordStore.getAll().forEach(record => {
                this.entityRecordStore.remove(record.id);
            });
            this.listsStore.getAll().forEach(list => {
                this.listsStore.remove(list.id);
            });

            // Load imported data
            importData.entities.forEach(entity => {
                this.entityStore.add(entity);
            });

            importData.records.forEach(record => {
                this.entityRecordStore.add(record);
            });

            (importData.lists || []).forEach(list => {
                this.listsStore.add(list);
            });

            alert('Data imported successfully!');
        })
        .catch(error => {
            alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        });
  }

  showCreateListModal = signal(false);
  showRenameListModal = signal(false);
  newListName = '';
  renameListId = '';
  renameListName = '';

  onClickAddListButton(): void {
    this.newListName = '';
    this.showCreateListModal.set(true);
  }

  onClickCreateListButton(): void {
    if (!this.newListName) {
      return;
    }
    this.listService.createList(this.newListName);
    this.showCreateListModal.set(false);
  }

  onClickRenameListButton(listId: string, currentName: string): void {
    this.renameListId = listId;
    this.renameListName = currentName;
    this.showRenameListModal.set(true);
  }

  onClickConfirmRenameListButton(): void {
    if (!this.renameListName.trim()) {
      return;
    }
    this.listService.renameList(this.renameListId, this.renameListName.trim());
    this.showRenameListModal.set(false);
  }

  onClickCancelRenameListButton(): void {
    this.showRenameListModal.set(false);
  }

  onClickDeleteListButton(listId: string): void {
    this.listService.deleteList(listId);
  }

  getListKeyPreview(): string {
    return generateEntityKey(this.newListName);
  }
}

