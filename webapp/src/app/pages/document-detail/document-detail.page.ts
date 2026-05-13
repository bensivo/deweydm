import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { DocumentService } from '../../services/document.service';
import { EntityService } from '../../services/entity.service';
import { EntityRecordService } from '../../services/entity-record.service';
import { Document } from '../../models/document.model';

/**
 * Detail page for a single document. Shows metadata, linked records, and a preview of the file.
 */
@Component({
    selector: 'app-document-detail-page',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        NzButtonModule,
        NzInputModule,
        NzFormModule,
        NzSelectModule,
        NzDividerModule,
        NzTagModule,
        NzPopconfirmModule,
    ],
    templateUrl: './document-detail.page.html',
    styleUrl: './document-detail.page.less',
})
export class DocumentDetailPageComponent implements OnInit {
    documentId = '';
    document = signal<Document | null>(null);
    fileDataUrl = signal<SafeResourceUrl | string | null>(null);
    textContent = signal<string | null>(null);
    isLoading = signal(true);

    // Add link form state
    selectedEntityId = '';
    selectedRecordId = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private documentService: DocumentService,
        private entityService: EntityService,
        private entityRecordService: EntityRecordService,
        private nzMessageService: NzMessageService,
        private sanitizer: DomSanitizer,
    ) {}

    get entities$() {
        return this.entityService.entities$;
    }

    get recordsForSelectedEntity() {
        if (!this.selectedEntityId) {
            return [];
        }
        return this.entityRecordService.getByEntityId(this.selectedEntityId).map(record => ({
            recordId: record.id,
            recordName: this.entityRecordService.getRecordDisplayName(this.selectedEntityId, record.id),
        }));
    }

    get linkedRecordLabels(): { entityName: string; recordName: string; entityId: string; recordId: string }[] {
        if (!this.document()) {
            return [];
        }
        return this.document()!.linkedRecords.map(link => {
            const entity = this.entityService.entities$().find(e => e.id === link.entityId);
            return {
                entityName: entity?.name ?? link.entityId,
                recordName: this.entityRecordService.getRecordDisplayName(link.entityId, link.recordId),
                entityId: link.entityId,
                recordId: link.recordId,
            };
        });
    }

    get isPdf(): boolean {
        return this.document()?.mimeType === 'application/pdf';
    }

    get isImage(): boolean {
        return this.document()?.mimeType?.startsWith('image/') ?? false;
    }

    get isText(): boolean {
        const mime = this.document()?.mimeType ?? '';
        return mime.startsWith('text/') || mime === 'application/json';
    }

    get safeFileUrl(): SafeResourceUrl | null {
        const url = this.fileDataUrl();
        if (!url) return null;
        if (this.isPdf) {
            return this.sanitizer.bypassSecurityTrustResourceUrl(url as string);
        }
        return url as SafeResourceUrl;
    }

    async ngOnInit(): Promise<void> {
        this.documentId = this.route.snapshot.paramMap.get('id') ?? '';
        console.log('Loading document with ID:', this.documentId);

        try {
            await this.documentService.loadAll();

            const doc = this.documentService.documents$().find(d => d.id === this.documentId) ?? null;
            this.document.set(doc);
            if (!doc) {
                console.warn('Document not found:', this.documentId);
                this.nzMessageService.error('Document not found');
                this.router.navigate(['/documents']);
                return;
            }

            console.log('Loading file data URL for document:', this.documentId);
            const dataUrl = await this.documentService.getFileDataUrl(this.documentId);
            this.fileDataUrl.set(dataUrl);
            console.log('Loaded file data URL for document:', this.documentId);

            if (this.isText && typeof dataUrl === 'string') {
                const base64Part = dataUrl.split(',')[1];
                if (base64Part) {
                    this.textContent.set(atob(base64Part));
                }
            }
        } catch (err) {
            console.error('Failed to load document:', err);
            this.nzMessageService.error('Failed to load document');
        } finally {
            this.isLoading.set(false);
            console.log('Finished loading document detail page for ID:', this.documentId);
        }
    }

    onClickBack(): void {
        this.router.navigate(['/documents']);
    }

    async onClickRemoveLink(entityId: string, recordId: string): Promise<void> {
        try {
            await this.documentService.removeLink(this.documentId, entityId, recordId);
            this.document.set(this.documentService.documents$().find(d => d.id === this.documentId) ?? null);
            this.nzMessageService.success('Link removed');
        } catch (err) {
            console.error('Failed to remove link:', err);
            this.nzMessageService.error('Failed to remove link');
        }
    }

    async onClickAddLink(): Promise<void> {
        if (!this.selectedEntityId || !this.selectedRecordId) {
            return;
        }
        try {
            await this.documentService.addLink(this.documentId, this.selectedEntityId, this.selectedRecordId);
            this.document.set(this.documentService.documents$().find(d => d.id === this.documentId) ?? null);
            this.selectedEntityId = '';
            this.selectedRecordId = '';
            this.nzMessageService.success('Link added');
        } catch (err) {
            console.error('Failed to add link:', err);
            this.nzMessageService.error('Failed to add link');
        }
    }

    async onClickDelete(): Promise<void> {
        try {
            await this.documentService.deleteDocument(this.documentId);
            this.nzMessageService.success('Document deleted');
            this.router.navigate(['/documents']);
        } catch (err) {
            console.error('Failed to delete document:', err);
            this.nzMessageService.error('Failed to delete document');
        }
    }
}
