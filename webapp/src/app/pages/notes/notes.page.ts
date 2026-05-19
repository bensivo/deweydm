import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';

import { NoteService } from '../../services/note.service';
import { Note } from '../../models/note.model';

/**
 * Page for browsing and creating notes.
 */
@Component({
    selector: 'app-notes-page',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        NzButtonModule,
        NzInputModule,
        NzTableModule,
        NzEmptyModule,
    ],
    templateUrl: './notes.page.html',
    styleUrl: './notes.page.less',
})
export class NotesPageComponent implements OnInit {
    searchQuery = '';

    constructor(
        private noteService: NoteService,
        private router: Router,
        private nzMessageService: NzMessageService,
    ) {}

    get notes$() {
        return this.noteService.notes$;
    }

    get filteredNotes(): Note[] {
        const query = this.searchQuery.trim().toLowerCase();
        if (!query) {
            return this.notes$();
        }
        return this.notes$().filter(n =>
            n.name.toLowerCase().includes(query) ||
            n.contentText.toLowerCase().includes(query),
        );
    }

    async ngOnInit(): Promise<void> {
        await this.noteService.loadAll();
    }

    async onClickNew(): Promise<void> {
        try {
            const note = await this.noteService.createNote('Untitled', '', '', '');
            this.router.navigate(['/notes', note.id]);
        } catch (err) {
            console.error('Failed to create note:', err);
            this.nzMessageService.error('Failed to create note');
        }
    }

    onClickRow(note: Note): void {
        this.router.navigate(['/notes', note.id]);
    }
}
