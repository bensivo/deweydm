import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { EntityService } from './services/entity.service';
import { generateEntityKey } from './services/entity-key.util';
import { ListsStore } from './store/lists.store';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterLink, RouterOutlet, NzLayoutModule, NzMenuModule],
    templateUrl: './app.html',
    styleUrl: './app.less'
})
export class App {
    constructor(
        private entityService: EntityService,
        private listsStore: ListsStore
    ) {}

    get entities$() {
        return this.entityService.entities$;
    }

    get lists$() {
        return this.listsStore.lists$;
    }

    getEntityKey(name: string): string {
        return generateEntityKey(name);
    }
}
