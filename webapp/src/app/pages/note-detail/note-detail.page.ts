import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NoteService } from '../../services/note.service';
import { EntityService } from '../../services/entity.service';
import { EntityRecordService } from '../../services/entity-record.service';
import { Note } from '../../models/note.model';
import { CardComponent } from '../../components/card/card.component';
import { EntityReferenceComponent } from '../../components/entity-reference/entity-reference.component';
import { NoteEditorComponent } from './note-editor/note-editor.component';

/**
 * Detail page for a single note. Shows metadata, linked records, and the rich text editor.
 */
@Component({
    selector: 'app-note-detail-page',
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
        NzCardModule,
        NzIconModule,
        NzTooltipModule,
        CardComponent,
        EntityReferenceComponent,
        NoteEditorComponent,
    ],
    templateUrl: './note-detail.page.html',
    styleUrl: './note-detail.page.less',
})
export class NoteDetailPageComponent implements OnInit {
    noteId = '';
    note = signal<Note | null>(null);
    isLoading = signal(true);

    isEditMode = signal(false);
    isSidebarOpen = signal(true);
    editName = '';
    editDescription = '';

    // Buffer for editor content updates between save clicks
    private pendingContentJson: string | null = null;
    private pendingContentText: string | null = null;

    // Add link form state
    selectedEntityId = '';
    selectedRecordId = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private noteService: NoteService,
        private entityService: EntityService,
        private location: Location,
        private entityRecordService: EntityRecordService,
        private nzMessageService: NzMessageService,
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

    linkedRecordLabels = computed<{ entityName: string; recordName: string; entityId: string; recordId: string }[]>(() => {
        const note = this.note();
        if (!note) {
            return [];
        }
        const entities = this.entityService.entities$();
        return note.linkedRecords.map(link => {
            const entity = entities.find(e => e.id === link.entityId);
            return {
                entityName: entity?.name ?? link.entityId,
                recordName: this.entityRecordService.getRecordDisplayName(link.entityId, link.recordId),
                entityId: link.entityId,
                recordId: link.recordId,
            };
        });
    });

    async ngOnInit(): Promise<void> {
        this.noteId = this.route.snapshot.paramMap.get('id') ?? '';

        try {
            await this.noteService.loadAll();

            const note = this.noteService.notes$().find(n => n.id === this.noteId) ?? null;
            this.note.set(note);
            if (!note) {
                console.warn('Note not found:', this.noteId);
                this.nzMessageService.error('Note not found');
                this.router.navigate(['/notes']);
                return;
            }
        } catch (err) {
            console.error('Failed to load note:', err);
            this.nzMessageService.error('Failed to load note');
        } finally {
            this.isLoading.set(false);
        }
    }

    onClickBack(): void {
        this.location.back();
    }

    onClickToggleSidebar(): void {
        this.isSidebarOpen.update(v => !v);
    }

    onClickEdit(): void {
        this.editName = this.note()?.name ?? '';
        this.editDescription = this.note()?.description ?? '';
        this.isEditMode.set(true);
    }

    onClickCancelEdit(): void {
        this.isEditMode.set(false);
    }

    async onClickSaveMeta(): Promise<void> {
        try {
            await this.noteService.updateNote(this.noteId, {
                name: this.editName,
                description: this.editDescription,
            });
            this.note.set(this.noteService.notes$().find(n => n.id === this.noteId) ?? null);
            this.isEditMode.set(false);
            this.nzMessageService.success('Note updated');
        } catch (err) {
            console.error('Failed to update note:', err);
            this.nzMessageService.error('Failed to update note');
        }
    }

    onEditorContentChange(content: { contentJson: string; contentText: string }): void {
        this.pendingContentJson = content.contentJson;
        this.pendingContentText = content.contentText;
    }

    async onClickSaveContent(): Promise<void> {
        if (this.pendingContentJson === null && this.pendingContentText === null) {
            return;
        }
        try {
            await this.noteService.updateNote(this.noteId, {
                contentJson: this.pendingContentJson ?? undefined,
                contentText: this.pendingContentText ?? undefined,
            });
            this.note.set(this.noteService.notes$().find(n => n.id === this.noteId) ?? null);
            this.pendingContentJson = null;
            this.pendingContentText = null;
            this.nzMessageService.success('Note saved');
        } catch (err) {
            console.error('Failed to save note content:', err);
            this.nzMessageService.error('Failed to save note');
        }
    }

    async onClickRemoveLink(entityId: string, recordId: string): Promise<void> {
        try {
            await this.noteService.removeLink(this.noteId, entityId, recordId);
            this.note.set(this.noteService.notes$().find(n => n.id === this.noteId) ?? null);
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
            await this.noteService.addLink(this.noteId, this.selectedEntityId, this.selectedRecordId);
            this.note.set(this.noteService.notes$().find(n => n.id === this.noteId) ?? null);
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
            await this.noteService.deleteNote(this.noteId);
            this.nzMessageService.success('Note deleted');
            this.router.navigate(['/notes']);
        } catch (err) {
            console.error('Failed to delete note:', err);
            this.nzMessageService.error('Failed to delete note');
        }
    }
}
