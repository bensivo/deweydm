import { Inject, Injectable } from '@angular/core';

import { Document, DocumentLink } from '../models/document.model';
import { DocumentStore } from '../store/document.store';
import { WorkspaceStore } from '../store/workspace.store';
import { BACKEND_API } from '../backend/backend-api.token';
import { Backend } from '../backend/backend-api.interface';

/**
 * Service for all document business logic, including IPC communication with the Electron backend.
 */
@Injectable({ providedIn: 'root' })
export class DocumentService {
    constructor(
        private documentStore: DocumentStore,
        private workspaceStore: WorkspaceStore,
        @Inject(BACKEND_API) private backend: Backend,
    ) {}

    get documents$() {
        return this.documentStore.documents$;
    }

    /**
     * Loads all documents from the backend and replaces the store contents.
     */
    async loadAll(workspaceId?: string): Promise<void> {
        const effectiveWorkspaceId = workspaceId ?? this.workspaceStore.getActiveId() ?? undefined;
        const documents: Document[] = await this.backend.documentGetAll(effectiveWorkspaceId);
        this.documentStore.setAll(documents);
    }

    /**
     * Creates a new document by uploading a File object.
     *
     * @param name - Display name for the document
     * @param description - Optional description
     * @param file - The File object from a file input element
     * @returns The newly created Document
     */
    async createDocument(name: string, description: string, file: File, workspaceId?: string): Promise<Document> {
        const arrayBuffer = await file.arrayBuffer();
        const effectiveWorkspaceId = workspaceId ?? this.workspaceStore.getActiveId() ?? undefined;
        const document: Document = await this.backend.documentCreate(
            name,
            description,
            file.name,
            file.type,
            arrayBuffer,
            effectiveWorkspaceId,
        );
        this.documentStore.add(document);
        return document;
    }

    /**
     * Updates mutable fields (name, description) for a document.
     *
     * @param id - The document ID
     * @param fields - Partial object with name and/or description
     */
    async updateDocument(id: string, fields: { name?: string; description?: string }): Promise<void> {
        await this.backend.documentUpdate(id, fields);
        this.documentStore.update(id, fields);
    }

    /**
     * Deletes a document by ID, removing it from the store.
     *
     * @param id - The document ID to delete
     */
    async deleteDocument(id: string): Promise<void> {
        await this.backend.documentDelete(id);
        this.documentStore.remove(id);
    }

    /**
     * Adds a link between a document and an entity record.
     *
     * @param documentId - The document ID
     * @param entityId - The entity ID
     * @param recordId - The record ID
     */
    async addLink(documentId: string, entityId: string, recordId: string): Promise<void> {
        await this.backend.documentAddLink(documentId, entityId, recordId);
        const document = this.documentStore.getById(documentId);
        if (document) {
            const newLink: DocumentLink = { entityId, recordId };
            this.documentStore.update(documentId, {
                linkedRecords: [...document.linkedRecords, newLink],
            });
        }
    }

    /**
     * Removes a link between a document and an entity record.
     *
     * @param documentId - The document ID
     * @param entityId - The entity ID
     * @param recordId - The record ID
     */
    async removeLink(documentId: string, entityId: string, recordId: string): Promise<void> {
        await this.backend.documentRemoveLink(documentId, entityId, recordId);
        const document = this.documentStore.getById(documentId);
        if (document) {
            this.documentStore.update(documentId, {
                linkedRecords: document.linkedRecords.filter(
                    l => !(l.entityId === entityId && l.recordId === recordId)
                ),
            });
        }
    }

    /**
     * Retrieves the file as a data URL suitable for rendering in an iframe or img tag.
     *
     * @param id - The document ID
     * @returns A data URL string
     */
    async getFileDataUrl(id: string): Promise<string> {
        const base64: string = await this.backend.documentGetFile(id);
        return base64;
    }
}
