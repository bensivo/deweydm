import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
    selector: 'app-save-view-modal',
    imports: [CommonModule, FormsModule, NzModalModule, NzButtonModule, NzInputModule],
    templateUrl: './save-view-modal.component.html',
    styleUrl: './save-view-modal.component.less'
})
export class SaveViewModalComponent {
    @Input() isOpen: boolean = false;
    @Input() entityId: string = '';

    @Output() onSave = new EventEmitter<string>();
    @Output() onCancel = new EventEmitter<void>();

    viewNameSignal = signal<string>('');

    onSaveClick(): void {
        const name = this.viewNameSignal().trim();
        if (name) {
            this.onSave.emit(name);
            this.viewNameSignal.set('');
        }
    }

    onCancelClick(): void {
        this.onCancel.emit();
        this.viewNameSignal.set('');
    }
}
