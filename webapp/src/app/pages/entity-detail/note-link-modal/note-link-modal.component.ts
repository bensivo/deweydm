import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';

import { Note } from '../../../models/note.model';

/**
 * Modal component for searching and selecting an existing note to link.
 */
@Component({
    selector: 'app-note-link-modal',
    imports: [
        CommonModule,
        FormsModule,
        NzModalModule,
        NzButtonModule,
        NzInputModule,
        NzTableModule,
    ],
    templateUrl: './note-link-modal.component.html',
    styleUrl: './note-link-modal.component.less',
})
export class NoteLinkModalComponent {
    @Input() isOpen = false;
    @Input() notes: Note[] = [];
    @Output() onSelect = new EventEmitter<Note>();
    @Output() onCancel = new EventEmitter<void>();

    searchQuery = '';

    get filteredNotes(): Note[] {
        const query = this.searchQuery.trim().toLowerCase();
        if (!query) {
            return this.notes;
        }
        return this.notes.filter(n => n.name.toLowerCase().includes(query));
    }

    onClickSelect(note: Note): void {
        this.searchQuery = '';
        this.onSelect.emit(note);
    }

    onClickCancel(): void {
        this.searchQuery = '';
        this.onCancel.emit();
    }
}
