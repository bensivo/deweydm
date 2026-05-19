import sqlite3 from 'sqlite3';

/**
 * A note stored in the application, with content and linked entity records.
 */
export interface Note {
    id: string;
    name: string;
    description: string;
    contentJson: string;
    contentText: string;
    createdAt: string;
    updatedAt: string;
    linkedRecords: NoteLink[];
}

export interface NoteLink {
    entityId: string;
    recordId: string;
}

/**
 * Service for CRUD operations on notes.
 * Note content and links are stored entirely in SQLite.
 */
export class NoteService {
    private db: sqlite3.Database;

    constructor(db: sqlite3.Database) {
        this.db = db;
    }

    /**
     * Fetches all notes with their linked records, ordered by most recently updated.
     * @returns A promise resolving to an array of Note objects.
     */
    async getAll(): Promise<Note[]> {
        const rows = await this.allQuery<NoteRow>(
            'SELECT id, name, description, content_json, content_text, created_at, updated_at FROM notes ORDER BY updated_at DESC'
        );

        const notes: Note[] = [];
        for (const row of rows) {
            const links = await this.getLinks(row.id);
            notes.push(this.rowToNote(row, links));
        }
        return notes;
    }

    /**
     * Fetches a single note by ID.
     * @param id - The note ID.
     * @returns A promise resolving to the Note, or undefined if not found.
     */
    async getById(id: string): Promise<Note | undefined> {
        const row = await this.getQuery<NoteRow>(
            'SELECT id, name, description, content_json, content_text, created_at, updated_at FROM notes WHERE id = ?',
            [id]
        );
        if (!row) return undefined;
        const links = await this.getLinks(id);
        return this.rowToNote(row, links);
    }

    /**
     * Creates a new note.
     *
     * @param name - Display name for the note
     * @param description - Optional description
     * @param contentJson - JSON-encoded rich content
     * @param contentText - Plain-text content for searching
     * @returns The newly created Note
     */
    async create(
        name: string,
        description: string,
        contentJson: string,
        contentText: string,
    ): Promise<Note> {
        const id = this.generateId();
        await this.runQuery(
            'INSERT INTO notes (id, name, description, content_json, content_text) VALUES (?, ?, ?, ?, ?)',
            [id, name, description, contentJson, contentText]
        );
        const note = await this.getById(id);
        if (!note) {
            throw new Error(`Failed to create note: ${id}`);
        }
        return note;
    }

    /**
     * Updates mutable fields on a note. Also bumps updated_at to CURRENT_TIMESTAMP.
     *
     * @param id - The note ID
     * @param fields - Partial object with any of name, description, contentJson, contentText
     */
    async update(
        id: string,
        fields: { name?: string; description?: string; contentJson?: string; contentText?: string },
    ): Promise<void> {
        const setClauses: string[] = [];
        const params: any[] = [];

        if (fields.name !== undefined) {
            setClauses.push('name = ?');
            params.push(fields.name);
        }
        if (fields.description !== undefined) {
            setClauses.push('description = ?');
            params.push(fields.description);
        }
        if (fields.contentJson !== undefined) {
            setClauses.push('content_json = ?');
            params.push(fields.contentJson);
        }
        if (fields.contentText !== undefined) {
            setClauses.push('content_text = ?');
            params.push(fields.contentText);
        }

        if (setClauses.length === 0) {
            return;
        }

        setClauses.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        await this.runQuery(
            `UPDATE notes SET ${setClauses.join(', ')} WHERE id = ?`,
            params
        );
    }

    /**
     * Deletes a note. Linked rows in note_links cascade automatically.
     * @param id - The note ID.
     */
    async delete(id: string): Promise<void> {
        await this.runQuery('DELETE FROM notes WHERE id = ?', [id]);
    }

    /**
     * Adds a link between a note and an entity record. De-dupes: if the same
     * (noteId, entityId, recordId) link already exists, does nothing.
     *
     * @param noteId - The note ID
     * @param entityId - The entity ID
     * @param recordId - The record ID
     */
    async addLink(noteId: string, entityId: string, recordId: string): Promise<void> {
        const existing = await this.getQuery<{ id: string }>(
            'SELECT id FROM note_links WHERE note_id = ? AND entity_id = ? AND record_id = ?',
            [noteId, entityId, recordId]
        );
        if (existing) {
            return;
        }
        const linkId = this.generateId();
        await this.runQuery(
            'INSERT INTO note_links (id, note_id, entity_id, record_id) VALUES (?, ?, ?, ?)',
            [linkId, noteId, entityId, recordId]
        );
    }

    /**
     * Removes a link between a note and an entity record.
     *
     * @param noteId - The note ID
     * @param entityId - The entity ID
     * @param recordId - The record ID
     */
    async removeLink(noteId: string, entityId: string, recordId: string): Promise<void> {
        await this.runQuery(
            'DELETE FROM note_links WHERE note_id = ? AND entity_id = ? AND record_id = ?',
            [noteId, entityId, recordId]
        );
    }

    private async getLinks(noteId: string): Promise<NoteLink[]> {
        const rows = await this.allQuery<{ entity_id: string; record_id: string }>(
            'SELECT entity_id, record_id FROM note_links WHERE note_id = ?',
            [noteId]
        );
        return rows.map(r => ({ entityId: r.entity_id, recordId: r.record_id }));
    }

    private rowToNote(row: NoteRow, links: NoteLink[]): Note {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            contentJson: row.content_json,
            contentText: row.content_text,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            linkedRecords: links,
        };
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // SQLite helper wrappers

    private runQuery(sql: string, params: any[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    private allQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows as T[]);
            });
        });
    }

    private getQuery<T>(sql: string, params: any[] = []): Promise<T | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row as T | undefined);
            });
        });
    }
}

interface NoteRow {
    id: string;
    name: string;
    description: string;
    content_json: string;
    content_text: string;
    created_at: string;
    updated_at: string;
}
