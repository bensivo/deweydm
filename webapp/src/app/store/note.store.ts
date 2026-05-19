import { Injectable, signal } from '@angular/core';

import { Note } from '../models/note.model';

/**
 * Signal-based store for Note state.
 */
@Injectable({ providedIn: 'root' })
export class NoteStore {
    private notesSignal = signal<Note[]>([]);
    public notes$ = this.notesSignal.asReadonly();

    setAll(notes: Note[]): void {
        this.notesSignal.set(notes);
    }

    getAll(): Note[] {
        return this.notesSignal();
    }

    getById(id: string): Note | undefined {
        return this.notesSignal().find(n => n.id === id);
    }

    add(note: Note): void {
        this.notesSignal.update(notes => [...notes, note]);
    }

    update(id: string, partial: Partial<Note>): void {
        this.notesSignal.update(notes =>
            notes.map(n => (n.id === id ? { ...n, ...partial } : n))
        );
    }

    remove(id: string): void {
        this.notesSignal.update(notes => notes.filter(n => n.id !== id));
    }
}
