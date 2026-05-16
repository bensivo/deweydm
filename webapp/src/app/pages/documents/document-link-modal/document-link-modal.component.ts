import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';

import { Document } from '../../../models/document.model';

/**
 * Modal component for searching and selecting an existing document to link.
 */
@Component({
    selector: 'app-document-link-modal',
    imports: [
        CommonModule,
        FormsModule,
        NzModalModule,
        NzButtonModule,
        NzInputModule,
        NzTableModule,
    ],
    templateUrl: './document-link-modal.component.html',
    styleUrl: './document-link-modal.component.less',
})
export class DocumentLinkModalComponent {
    @Input() isOpen = false;
    @Input() documents: Document[] = [];
    @Output() onSelect = new EventEmitter<Document>();
    @Output() onCancel = new EventEmitter<void>();

    searchQuery = '';

    get filteredDocuments(): Document[] {
        const query = this.searchQuery.trim().toLowerCase();
        if (!query) {
            return this.documents;
        }
        return this.documents.filter(d => d.name.toLowerCase().includes(query));
    }

    onClickSelect(document: Document): void {
        this.searchQuery = '';
        this.onSelect.emit(document);
    }

    onClickCancel(): void {
        this.searchQuery = '';
        this.onCancel.emit();
    }
}
