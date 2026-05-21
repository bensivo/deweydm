import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';

/**
 * A document stored in the application, with metadata and linked entity records.
 */
export interface Document {
    id: string;
    name: string;
    description: string;
    originalFileName: string;
    mimeType: string;
    createdAt: string;
    linkedRecords: DocumentLink[];
}

export interface DocumentLink {
    entityId: string;
    recordId: string;
}

/**
 * Service for CRUD operations on documents.
 * File bytes are stored on disk; metadata and links are stored in SQLite.
 */
export class DocumentService {
    private db: sqlite3.Database;
    private documentsDir: string;

    constructor(db: sqlite3.Database, documentsDir: string) {
        this.db = db;
        this.documentsDir = documentsDir;
    }

    /**
     * Fetches all documents with their linked records.
     * @returns A promise resolving to an array of Document objects.
     */
    async getAll(workspaceId?: string): Promise<Document[]> {
        const sql = workspaceId
            ? 'SELECT id, name, description, original_file_name, mime_type, file_path, created_at FROM documents WHERE workspace_id = ? ORDER BY created_at DESC'
            : 'SELECT id, name, description, original_file_name, mime_type, file_path, created_at FROM documents ORDER BY created_at DESC';
        const params = workspaceId ? [workspaceId] : [];
        const rows = await this.allQuery<{
            id: string;
            name: string;
            description: string;
            original_file_name: string;
            mime_type: string;
            file_path: string;
            created_at: string;
        }>(sql, params);

        const documents: Document[] = [];
        for (const row of rows) {
            const links = await this.getLinks(row.id);
            documents.push(this.rowToDocument(row, links));
        }
        return documents;
    }

    /**
     * Fetches a single document by ID.
     * @param id - The document ID.
     * @returns A promise resolving to the Document, or undefined if not found.
     */
    async getById(id: string): Promise<Document | undefined> {
        const row = await this.getQuery<{
            id: string;
            name: string;
            description: string;
            original_file_name: string;
            mime_type: string;
            file_path: string;
            created_at: string;
        }>('SELECT id, name, description, original_file_name, mime_type, file_path, created_at FROM documents WHERE id = ?', [id]);

        if (!row) return undefined;
        const links = await this.getLinks(id);
        return this.rowToDocument(row, links);
    }

    /**
     * Creates a new document, writing the file to disk and inserting metadata into SQLite.
     *
     * @param name - Display name for the document
     * @param description - Optional description
     * @param originalFileName - The original filename from the user's machine
     * @param mimeType - The MIME type of the file
     * @param fileBuffer - The raw file bytes
     * @returns The newly created Document
     */
    async create(
        name: string,
        description: string,
        originalFileName: string,
        mimeType: string,
        fileBuffer: Buffer,
        workspaceId?: string,
    ): Promise<Document> {
        const id = this.generateId();
        const safeFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const relativeFilePath = `${id}_${safeFileName}`;
        const absoluteFilePath = path.join(this.documentsDir, relativeFilePath);

        fs.writeFileSync(absoluteFilePath, fileBuffer);

        await this.runQuery(
            'INSERT INTO documents (id, name, description, original_file_name, mime_type, file_path, workspace_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, description, originalFileName, mimeType, relativeFilePath, workspaceId ?? null]
        );

        return {
            id,
            name,
            description,
            originalFileName,
            mimeType,
            createdAt: new Date().toISOString(),
            linkedRecords: [],
        };
    }

    /**
     * Deletes a document, removing the file from disk and the row from SQLite.
     * @param id - The document ID.
     */
    async delete(id: string): Promise<void> {
        const row = await this.getQuery<{ file_path: string }>(
            'SELECT file_path FROM documents WHERE id = ?',
            [id]
        );
        if (row) {
            const absoluteFilePath = path.join(this.documentsDir, row.file_path);
            if (fs.existsSync(absoluteFilePath)) {
                fs.unlinkSync(absoluteFilePath);
            }
        }
        await this.runQuery('DELETE FROM documents WHERE id = ?', [id]);
    }

    /**
     * Updates mutable fields (name, description) for a document.
     *
     * @param id - The document ID
     * @param fields - Partial object with name and/or description
     */
    async update(id: string, fields: { name?: string; description?: string }): Promise<void> {
        if (fields.name !== undefined && fields.description !== undefined) {
            await this.runQuery('UPDATE documents SET name = ?, description = ? WHERE id = ?', [fields.name, fields.description, id]);
        } else if (fields.name !== undefined) {
            await this.runQuery('UPDATE documents SET name = ? WHERE id = ?', [fields.name, id]);
        } else if (fields.description !== undefined) {
            await this.runQuery('UPDATE documents SET description = ? WHERE id = ?', [fields.description, id]);
        }
    }

    /**
     * Adds a link between a document and an entity record.
     *
     * @param documentId - The document ID
     * @param entityId - The entity ID
     * @param recordId - The record ID
     */
    async addLink(documentId: string, entityId: string, recordId: string): Promise<void> {
        const linkId = this.generateId();
        await this.runQuery(
            'INSERT INTO document_links (id, document_id, entity_id, record_id) VALUES (?, ?, ?, ?)',
            [linkId, documentId, entityId, recordId]
        );
    }

    /**
     * Removes a link between a document and an entity record.
     *
     * @param documentId - The document ID
     * @param entityId - The entity ID
     * @param recordId - The record ID
     */
    async removeLink(documentId: string, entityId: string, recordId: string): Promise<void> {
        await this.runQuery(
            'DELETE FROM document_links WHERE document_id = ? AND entity_id = ? AND record_id = ?',
            [documentId, entityId, recordId]
        );
    }

    /**
     * Reads the raw file bytes for a document.
     *
     * @param id - The document ID
     * @returns A Buffer containing the file bytes
     * @throws If the document or file is not found
     */
    async getFileBuffer(id: string): Promise<Buffer> {
        const row = await this.getQuery<{ file_path: string }>(
            'SELECT file_path FROM documents WHERE id = ?',
            [id]
        );
        if (!row) {
            throw new Error(`Document not found: ${id}`);
        }
        const absoluteFilePath = path.join(this.documentsDir, row.file_path);
        return fs.readFileSync(absoluteFilePath);
    }

    private async getLinks(documentId: string): Promise<DocumentLink[]> {
        const rows = await this.allQuery<{ entity_id: string; record_id: string }>(
            'SELECT entity_id, record_id FROM document_links WHERE document_id = ?',
            [documentId]
        );
        return rows.map(r => ({ entityId: r.entity_id, recordId: r.record_id }));
    }

    private rowToDocument(
        row: { id: string; name: string; description: string; original_file_name: string; mime_type: string; file_path: string; created_at: string },
        links: DocumentLink[]
    ): Document {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            originalFileName: row.original_file_name,
            mimeType: row.mime_type,
            createdAt: row.created_at,
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
