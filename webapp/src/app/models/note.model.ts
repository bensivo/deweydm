/**
 * Model for a note authored inside the application.
 *
 * Notes are markdown-backed rich text documents. The canonical store is the
 * Lexical editor state JSON (`contentJson`), with a plain-text projection
 * (`contentText`) cached for search/preview.
 */
export interface Note {
    id: string;
    name: string;
    description: string;
    // Serialized Lexical editor state as a JSON string. Empty string for new notes.
    contentJson: string;
    // Plain-text projection for search/preview (derived on save).
    contentText: string;
    createdAt: string;
    updatedAt: string;
    linkedRecords: NoteLink[];
}

export interface NoteLink {
    entityId: string;
    recordId: string;
}
