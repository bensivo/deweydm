/**
 * Model for a document stored in the application.
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
