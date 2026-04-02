import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { Entity } from '../../models/entity.model';

/**
 * Modal component for selecting an entity type during the global create workflow.
 * Displays all available entities as clickable buttons.
 */
@Component({
    selector: 'app-global-create-entity-select',
    standalone: true,
    imports: [CommonModule, NzModalModule, NzButtonModule, NzEmptyModule],
    templateUrl: './entity-select-modal.component.html',
    styleUrl: './entity-select-modal.component.less'
})
export class EntitySelectModalComponent {
    isOpen = input.required<boolean>();
    entities = input.required<Entity[]>();

    onSelectEntity = output<string>();
    onCancel = output<void>();

    onClickEntityButton(entityId: string): void {
        this.onSelectEntity.emit(entityId);
    }

    onClickCancel(): void {
        this.onCancel.emit();
    }
}
