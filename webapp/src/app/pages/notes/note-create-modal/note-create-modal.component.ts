import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';

export interface NoteCreateData {
    name: string;
}

/**
 * Modal component for creating a new note.
 */
@Component({
    selector: 'app-note-create-modal',
    imports: [
        CommonModule,
        FormsModule,
        NzModalModule,
        NzButtonModule,
        NzInputModule,
        NzFormModule,
    ],
    templateUrl: './note-create-modal.component.html',
    styleUrl: './note-create-modal.component.less',
})
export class NoteCreateModalComponent {
    @Input() isOpen = false;
    @Output() onSubmit = new EventEmitter<NoteCreateData>();
    @Output() onCancel = new EventEmitter<void>();

    nameValue = '';

    get isSubmitDisabled(): boolean {
        return !this.nameValue.trim();
    }

    onClickSubmit(): void {
        if (!this.nameValue.trim()) {
            return;
        }
        this.onSubmit.emit({
            name: this.nameValue.trim(),
        });
        this.resetForm();
    }

    onClickCancel(): void {
        this.resetForm();
        this.onCancel.emit();
    }

    private resetForm(): void {
        this.nameValue = '';
    }
}
