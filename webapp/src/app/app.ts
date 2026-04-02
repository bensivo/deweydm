import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { EntityService } from './services/entity.service';
import { EntityRecordService } from './services/entity-record.service';
import { generateEntityKey } from './services/entity-key.util';
import { ListsStore } from './store/lists.store';
import { GlobalCreateStore } from './store/global-create.store';
import { EntitySelectModalComponent } from './components/global-create/entity-select-modal.component';
import { FormModalComponent } from './components/global-create/form-modal.component';

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        RouterLink,
        RouterOutlet,
        NzLayoutModule,
        NzMenuModule,
        NzButtonModule,
        EntitySelectModalComponent,
        FormModalComponent
    ],
    templateUrl: './app.html',
    styleUrl: './app.less'
})
export class App {
    constructor(
        private entityService: EntityService,
        private entityRecordService: EntityRecordService,
        private listsStore: ListsStore,
        private globalCreateStore: GlobalCreateStore,
        private router: Router
    ) {}

    get entities$() {
        return this.entityService.entities$;
    }

    get lists$() {
        return this.listsStore.lists$;
    }

    get isCreateModalOpen$() {
        return this.globalCreateStore.isCreateModalOpen$;
    }

    get isFormModalOpen$() {
        return this.globalCreateStore.isFormModalOpen$;
    }

    get selectedEntity$() {
        return this.globalCreateStore.selectedEntity$;
    }

    get selectedEntityId$() {
        return this.globalCreateStore.selectedEntityId$;
    }

    get formData$() {
        return this.globalCreateStore.formData$;
    }

    getEntityKey(name: string): string {
        return generateEntityKey(name);
    }

    onClickCreateButton(): void {
        this.globalCreateStore.openEntitySelectModal();
    }

    onSelectEntity(entityId: string): void {
        this.globalCreateStore.selectEntity(entityId);
    }

    onCancelEntitySelect(): void {
        this.globalCreateStore.closeCreateFlow();
    }

    onFormSubmit(formData: Record<string, string>): void {
        const entity = this.globalCreateStore.selectedEntity$();
        if (!entity) {
            return;
        }
        this.entityRecordService.createRecord(entity.id, formData);
        this.globalCreateStore.closeCreateFlow();
    }

    onFormCancel(): void {
        this.globalCreateStore.closeCreateFlow();
    }
}
