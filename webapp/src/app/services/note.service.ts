import { Inject, Injectable } from '@angular/core';

import { Note, NoteLink } from '../models/note.model';
import { NoteStore } from '../store/note.store';
import { BACKEND_API } from '../backend/backend-api.token';
import { Backend } from '../backend/backend-api.interface';

/**
 * Service for all note business logic, including communication with the backend abstraction.
 */
@Injectable({ providedIn: 'root' })
export class NoteService {
    constructor(
        private noteStore: NoteStore,
        @Inject(BACKEND_API) private backend: Backend,
    ) {}

    get notes$() {
        return this.noteStore.notes$;
    }

    /**
     * Loads all notes from the backend and replaces the store contents.
     */
    async loadAll(): Promise<void> {
        const notes: Note[] = await this.backend.noteGetAll();
        this.noteStore.setAll(notes);
    }

    /**
     * Creates a new note with the given metadata and editor content.
     *
     * @param name - Display name for the note
     * @param description - Optional short description
     * @param contentJson - Serialized Lexical editor state
     * @param contentText - Plain-text projection used for search/preview
     * @returns The newly created Note
     */
    async createNote(
        name: string,
        description: string,
        contentJson: string,
        contentText: string,
    ): Promise<Note> {
        const note: Note = await this.backend.noteCreate(name, description, contentJson, contentText);
        this.noteStore.add(note);
        return note;
    }

    /**
     * Updates mutable fields on a note.
     *
     * @param id - The note ID
     * @param fields - Partial object with any combination of name, description, contentJson, contentText
     */
    async updateNote(
        id: string,
        fields: { name?: string; description?: string; contentJson?: string; contentText?: string },
    ): Promise<void> {
        await this.backend.noteUpdate(id, fields);
        const updatedAt = new Date().toISOString();
        this.noteStore.update(id, { ...fields, updatedAt });
    }

    /**
     * Deletes a note by ID.
     *
     * @param id - The note ID to delete
     */
    async deleteNote(id: string): Promise<void> {
        await this.backend.noteDelete(id);
        this.noteStore.remove(id);
    }

    /**
     * Adds a link between a note and an entity record.
     */
    async addLink(noteId: string, entityId: string, recordId: string): Promise<void> {
        await this.backend.noteAddLink(noteId, entityId, recordId);
        const note = this.noteStore.getById(noteId);
        if (note) {
            const newLink: NoteLink = { entityId, recordId };
            this.noteStore.update(noteId, {
                linkedRecords: [...note.linkedRecords, newLink],
            });
        }
    }

    /**
     * Removes a link between a note and an entity record.
     */
    async removeLink(noteId: string, entityId: string, recordId: string): Promise<void> {
        await this.backend.noteRemoveLink(noteId, entityId, recordId);
        const note = this.noteStore.getById(noteId);
        if (note) {
            this.noteStore.update(noteId, {
                linkedRecords: note.linkedRecords.filter(
                    l => !(l.entityId === entityId && l.recordId === recordId),
                ),
            });
        }
    }
}
