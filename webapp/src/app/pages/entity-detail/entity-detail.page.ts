import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';

import { EntityService } from '../../services/entity.service';
import { EntityRecordService } from '../../services/entity-record.service';
import { EntityStore } from '../../store/entity.store';
import { EntityField } from '../../models/entity.model';
import { EntityRecord } from '../../models/entity-record.model';
import { generateEntityKey } from '../../services/entity-key.util';
import { EntityReferenceComponent } from '../../components/entity-reference/entity-reference.component';
import { DocumentService } from '../../services/document.service';
import { DocumentUploadModalComponent, DocumentUploadData } from '../documents/document-upload-modal/document-upload-modal.component';
import { DocumentLinkModalComponent } from '../documents/document-link-modal/document-link-modal.component';
import { Document } from '../../models/document.model';
import { NoteService } from '../../services/note.service';
import { Note } from '../../models/note.model';
import { NoteCreateModalComponent, NoteCreateData } from '../notes/note-create-modal/note-create-modal.component';
import { NoteLinkModalComponent } from './note-link-modal/note-link-modal.component';

@Component({
    selector: 'app-entity-detail-page',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        NzButtonModule,
        NzInputModule,
        NzFormModule,
        NzCardModule,
        NzSelectModule,
        NzModalModule,
        NzIconModule,
        NzTooltipModule,
        EntityReferenceComponent,
        DocumentUploadModalComponent,
        DocumentLinkModalComponent,
        NoteCreateModalComponent,
        NoteLinkModalComponent,
    ],
    templateUrl: './entity-detail.page.html',
    styleUrl: './entity-detail.page.less'
})
export class EntityDetailPageComponent implements OnInit {
    private entityKeySignal = signal<string>('');
    private recordIdSignal = signal<string>('');

    entity$ = computed(() => {
        const key = this.entityKeySignal();
        const entities = this.entityService.entities$();
        return entities.find(e => generateEntityKey(e.name) === key);
    });

    record$ = computed(() => {
        const id = this.recordIdSignal();
        return this.entityRecordService.records$().find(r => r.id === id);
    });

    allDocuments$ = computed(() => this.documentService.documents$());

    linkedDocuments$ = computed(() => {
        const entity = this.entity$();
        const record = this.record$();
        if (!entity || !record) return [];
        return this.documentService.documents$().filter(doc =>
            doc.linkedRecords.some(link => link.entityId === entity.id && link.recordId === record.id)
        );
    });

    allNotes$ = computed(() => this.noteService.notes$());

    linkedNotes$ = computed(() => {
        const entity = this.entity$();
        const record = this.record$();
        if (!entity || !record) return [];
        return this.noteService.notes$().filter(note =>
            note.linkedRecords.some(link => link.entityId === entity.id && link.recordId === record.id)
        );
    });

    isEditMode = signal(false);
    isDeleteConfirmModalOpen = signal(false);
    isUploadModalOpen = signal(false);
    isLinkModalOpen = signal(false);
    isNoteCreateModalOpen = signal(false);
    isNoteLinkModalOpen = signal(false);

    // Working copy of data during edit. Initialized when edit mode is entered.
    editData = signal<Record<string, string>>({});

    // Cache for reference-list values to avoid infinite change detection loops
    private refListValueCache = '';
    private refListValueCacheArray: string[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private entityService: EntityService,
        public entityRecordService: EntityRecordService,
        private entityStore: EntityStore,
        private documentService: DocumentService,
        private noteService: NoteService,
        private messageService: NzMessageService
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.entityKeySignal.set(params['key']);
            this.recordIdSignal.set(params['id']);
            if (!this.entity$() || !this.record$()) {
                this.router.navigate(['/']);
            }
        });
        this.documentService.loadAll();
        this.noteService.loadAll();
    }

    getFieldValue(fieldId: string): string {
        return this.record$()?.data[fieldId] ?? '';
    }

    getEditValue(fieldId: string): string {
        return this.editData()[fieldId] ?? '';
    }

    setEditValue(fieldId: string, value: string): void {
        this.editData.update(current => ({ ...current, [fieldId]: value }));
    }

    onClickBackButton(): void {
        this.location.back();
    }

    onClickEdit(): void {
        const record = this.record$();
        if (!record) return;
        // Copy current data into the working edit buffer
        this.editData.set({ ...record.data });
        this.isEditMode.set(true);
    }

    onClickCancelEdit(): void {
        this.isEditMode.set(false);
    }

    async onClickSave(): Promise<void> {
        const record = this.record$();
        if (!record) return;
        await this.entityRecordService.updateRecord(record.id, this.editData());
        this.isEditMode.set(false);
    }

    onClickDelete(): void {
        this.isDeleteConfirmModalOpen.set(true);
    }

    async onConfirmDelete(): Promise<void> {
        const record = this.record$();
        const entity = this.entity$();
        if (!record || !entity) return;

        await this.entityRecordService.deleteRecord(record.id);
        this.isDeleteConfirmModalOpen.set(false);
        this.router.navigate(['/entity', generateEntityKey(entity.name)]);
    }

    onCancelDelete(): void {
        this.isDeleteConfirmModalOpen.set(false);
    }

    onClickUploadDocument(): void {
        this.isUploadModalOpen.set(true);
    }

    async onUploadDocumentSubmit(data: DocumentUploadData): Promise<void> {
        const entity = this.entity$();
        const record = this.record$();
        if (!entity || !record) return;

        try {
            const newDoc = await this.documentService.createDocument(data.name, data.description, data.file);
            await this.documentService.addLink(newDoc.id, entity.id, record.id);
            this.messageService.success('Document uploaded and linked successfully');
        } catch (error) {
            this.messageService.error('Failed to upload document');
        }

        this.isUploadModalOpen.set(false);
    }

    onUploadDocumentCancel(): void {
        this.isUploadModalOpen.set(false);
    }

    onClickLinkExisting(): void {
        this.isLinkModalOpen.set(true);
    }

    async onLinkDocumentSelect(doc: Document): Promise<void> {
        this.isLinkModalOpen.set(false);
        const entity = this.entity$();
        const record = this.record$();
        if (!entity || !record) return;
        try {
            await this.documentService.addLink(doc.id, entity.id, record.id);
            this.messageService.success('Document linked');
        } catch (error) {
            this.messageService.error('Failed to link document');
        }
    }

    onLinkDocumentCancel(): void {
        this.isLinkModalOpen.set(false);
    }

    async onClickUnlinkDocument(documentId: string): Promise<void> {
        const entity = this.entity$();
        const record = this.record$();
        if (!entity || !record) return;

        try {
            await this.documentService.removeLink(documentId, entity.id, record.id);
            this.messageService.success('Document unlinked');
        } catch (error) {
            this.messageService.error('Failed to unlink document');
        }
    }

    onClickCreateNote(): void {
        this.isNoteCreateModalOpen.set(true);
    }

    async onCreateNoteSubmit(data: NoteCreateData): Promise<void> {
        const entity = this.entity$();
        const record = this.record$();
        if (!entity || !record) return;

        try {
            const newNote = await this.noteService.createNote(data.name, '', '', '');
            await this.noteService.addLink(newNote.id, entity.id, record.id);
            this.messageService.success('Note created and linked successfully');
        } catch (error) {
            this.messageService.error('Failed to create note');
        }

        this.isNoteCreateModalOpen.set(false);
    }

    onCreateNoteCancel(): void {
        this.isNoteCreateModalOpen.set(false);
    }

    onClickLinkExistingNote(): void {
        this.isNoteLinkModalOpen.set(true);
    }

    async onLinkNoteSelect(note: Note): Promise<void> {
        this.isNoteLinkModalOpen.set(false);
        const entity = this.entity$();
        const record = this.record$();
        if (!entity || !record) return;
        try {
            await this.noteService.addLink(note.id, entity.id, record.id);
            this.messageService.success('Note linked');
        } catch (error) {
            this.messageService.error('Failed to link note');
        }
    }

    onLinkNoteCancel(): void {
        this.isNoteLinkModalOpen.set(false);
    }

    async onClickUnlinkNote(noteId: string): Promise<void> {
        const entity = this.entity$();
        const record = this.record$();
        if (!entity || !record) return;

        try {
            await this.noteService.removeLink(noteId, entity.id, record.id);
            this.messageService.success('Note unlinked');
        } catch (error) {
            this.messageService.error('Failed to unlink note');
        }
    }

    getReferenceOptions(field: EntityField) {
        return this.entityRecordService.getReferenceOptions(field)
    }

    getReferencedRecordDisplayName(field: EntityField, recordId: string): string {
        return this.entityRecordService.getRecordDisplayName(field.referenceEntityId!, recordId);
    }

    getReferencedEntityRouteKey(field: EntityField): string | null {
        return this.entityRecordService.getReferenceRouteKey(field);
    }

    getRefListValues(fieldId: string): string[] {
        const value = this.getEditValue(fieldId);
        // Cache the array to avoid creating new references on every change detection cycle
        if (value !== this.refListValueCache) {
            this.refListValueCache = value;
            this.refListValueCacheArray = value ? value.split(',') : [];
        }
        return this.refListValueCacheArray;
    }

    setRefListValues(fieldId: string, values: string[]): void {
        const joined = values.join(',');
        this.setEditValue(fieldId, joined);
    }

    getRefListViewItems(field: EntityField): { label: string; id: string; routeKey: string | null }[] {
        const value = this.getFieldValue(field.id);
        return this.entityRecordService.getRefListItems(value, field).map(record => ({
            id: record.id,
            label: this.entityRecordService.getRecordDisplayName(field.referenceEntityId!, record.id),
            routeKey: this.entityRecordService.getReferenceRouteKey(field)
        }))
    }

    getBacklinkedRecords(field: EntityField): EntityRecord[] {
        if (!field.backlinkSourceEntityId || !field.backlinkSourceFieldId) {
            return [];
        }
        const record = this.record$();
        if (!record) return [];
        return this.entityRecordService.getBacklinkedRecords(
            field.backlinkSourceEntityId,
            field.backlinkSourceFieldId,
            record.id
        );
    }

    getBacklinkSourceEntityRouteKey(field: EntityField): string | null {
        if (!field.backlinkSourceEntityId) return null;
        const entity = this.entityStore.getById(field.backlinkSourceEntityId);
        if (!entity) return null;
        return generateEntityKey(entity.name);
    }
}
