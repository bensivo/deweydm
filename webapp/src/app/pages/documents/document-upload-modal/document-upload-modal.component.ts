import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';

export interface DocumentUploadData {
    name: string;
    description: string;
    file: File;
}

/**
 * Modal component for uploading a new document.
 */
@Component({
    selector: 'app-document-upload-modal',
    imports: [
        CommonModule,
        FormsModule,
        NzModalModule,
        NzButtonModule,
        NzInputModule,
        NzFormModule,
    ],
    templateUrl: './document-upload-modal.component.html',
    styleUrl: './document-upload-modal.component.less',
})
export class DocumentUploadModalComponent {
    @Input() isOpen = false;
    @Output() onSubmit = new EventEmitter<DocumentUploadData>();
    @Output() onCancel = new EventEmitter<void>();

    nameValue = '';
    descriptionValue = '';
    selectedFile: File | null = null;

    get isSubmitDisabled(): boolean {
        return !this.nameValue.trim() || !this.selectedFile;
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
            if (!this.nameValue) {
                this.nameValue = input.files[0].name.replace(/\.[^.]+$/, '');
            }
        }
    }

    onClickSubmit(): void {
        if (!this.selectedFile || !this.nameValue.trim()) {
            return;
        }
        this.onSubmit.emit({
            name: this.nameValue.trim(),
            description: this.descriptionValue.trim(),
            file: this.selectedFile,
        });
        this.resetForm();
    }

    onClickCancel(): void {
        this.resetForm();
        this.onCancel.emit();
    }

    private resetForm(): void {
        this.nameValue = '';
        this.descriptionValue = '';
        this.selectedFile = null;
    }
}
