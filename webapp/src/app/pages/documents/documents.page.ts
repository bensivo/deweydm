import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';

import { DocumentService } from '../../services/document.service';
import { Document } from '../../models/document.model';
import { DocumentUploadModalComponent, DocumentUploadData } from './document-upload-modal/document-upload-modal.component';

/**
 * Page for browsing and uploading documents.
 */
@Component({
    selector: 'app-documents-page',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        NzButtonModule,
        NzInputModule,
        NzTableModule,
        NzEmptyModule,
        DocumentUploadModalComponent,
    ],
    templateUrl: './documents.page.html',
    styleUrl: './documents.page.less',
})
export class DocumentsPageComponent implements OnInit {
    isUploadModalOpen = false;
    searchQuery = '';

    constructor(
        private documentService: DocumentService,
        private router: Router,
        private nzMessageService: NzMessageService,
    ) {}

    get documents$() {
        return this.documentService.documents$;
    }

    get filteredDocuments(): Document[] {
        const query = this.searchQuery.trim().toLowerCase();
        if (!query) {
            return this.documents$();
        }
        return this.documents$().filter(d => d.name.toLowerCase().includes(query));
    }

    async ngOnInit(): Promise<void> {
        await this.documentService.loadAll();
    }

    onClickUpload(): void {
        this.isUploadModalOpen = true;
    }

    async onUploadSubmit(data: DocumentUploadData): Promise<void> {
        try {
            await this.documentService.createDocument(data.name, data.description, data.file);
            this.isUploadModalOpen = false;
            this.nzMessageService.success('Document uploaded successfully');
        } catch (err) {
            console.error('Failed to upload document:', err);
            this.nzMessageService.error('Failed to upload document');
        }
    }

    onUploadCancel(): void {
        this.isUploadModalOpen = false;
    }

    onClickRow(document: Document): void {
        this.router.navigate(['/documents', document.id]);
    }
}
