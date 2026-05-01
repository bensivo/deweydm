import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';

import { EntityService } from './services/entity.service';
import { EntityRecordService } from './services/entity-record.service';
import { SearchService } from './services/search.service';
import { ViewService } from './services/view.service';
import { generateEntityKey } from './services/entity-key.util';
import { ListsStore } from './store/lists.store';
import { SearchStore } from './store/search.store';
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
        NzInputModule,
        NzAutocompleteModule,
        EntitySelectModalComponent,
        FormModalComponent
    ],
    templateUrl: './app.html',
    styleUrl: './app.less'
})
export class App {
    private highlightedIndex = 0;

    constructor(
        private entityService: EntityService,
        private entityRecordService: EntityRecordService,
        private searchService: SearchService,
        private viewService: ViewService,
        private listsStore: ListsStore,
        private searchStore: SearchStore,
        private globalCreateStore: GlobalCreateStore,
        private router: Router
    ) {
        this.entityService.loadAll();
    }

    get entities$() {
        return this.entityService.entities$;
    }

    get lists$() {
        return this.listsStore.lists$;
    }

    get views$() {
        return this.viewService.views$;
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

    get searchQuery$() {
        return this.searchStore.searchQuery$;
    }

    get searchResults$() {
        return this.searchStore.searchResults$;
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

    onSearchInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.highlightedIndex = 0;
        this.searchService.performSearch(input.value);
    }

    onSearchSelect(result: any): void {
        this.router.navigate(['/entity', result.entityKey, result.recordId]);
        this.searchService.clearSearch();
        this.highlightedIndex = 0;
    }

    onSearchKeydown(event: KeyboardEvent): void {
        const results = this.searchResults$();
        if (results.length === 0) return;

        if (event.key === 'ArrowDown') {
            this.highlightedIndex = Math.min(this.highlightedIndex + 1, results.length - 1);
            event.preventDefault();
        } else if (event.key === 'ArrowUp') {
            this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
            event.preventDefault();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            this.onSearchSelect(results[this.highlightedIndex]);
        }
    }
}
