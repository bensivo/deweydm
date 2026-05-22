import * as fs from 'fs';
import * as path from 'path';
import { CommandDefinition } from './types';

/**
 * Minimal extension -> mimetype lookup. Anything not listed defaults to
 * `application/octet-stream`, matching the plan.
 */
const MIME_TYPES: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

function guessMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] ?? 'application/octet-stream';
}

export const documentCommands: CommandDefinition[] = [
    {
        resource: 'document',
        action: 'get-all',
        description: 'List documents, optionally scoped to a workspace.',
        flags: [
            { name: 'workspace-id', description: 'Workspace id.', required: false, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.document.getAll(args['workspace-id'] as string | undefined),
    },
    {
        resource: 'document',
        action: 'get-by-id',
        description: 'Fetch a document metadata record by id.',
        flags: [
            { name: 'id', description: 'Document id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.document.getById(args['id'] as string),
    },
    {
        resource: 'document',
        action: 'create',
        description: 'Upload a file as a new document. originalFileName and mimeType are derived from the path.',
        flags: [
            { name: 'name', description: 'Display name.', required: true, type: 'string' },
            { name: 'description', description: 'Description.', required: true, type: 'string' },
            { name: 'file', description: 'Path to the file on disk to upload.', required: true, type: 'file-path' },
            { name: 'workspace-id', description: 'Workspace id.', required: false, type: 'string' },
        ],
        run: async (args, ctx) => {
            const filePath = args['file'] as string;
            const buffer = fs.readFileSync(filePath);
            const originalFileName = path.basename(filePath);
            const mimeType = guessMimeType(filePath);
            return ctx.services.document.create(
                args['name'] as string,
                args['description'] as string,
                originalFileName,
                mimeType,
                buffer,
                args['workspace-id'] as string | undefined,
            );
        },
    },
    {
        resource: 'document',
        action: 'delete',
        description: 'Delete a document and its file on disk.',
        flags: [
            { name: 'id', description: 'Document id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.document.delete(args['id'] as string),
    },
    {
        resource: 'document',
        action: 'update',
        description: 'Update a document metadata fields (name and/or description).',
        flags: [
            { name: 'id', description: 'Document id.', required: true, type: 'string' },
            { name: 'name', description: 'New name.', required: false, type: 'string' },
            { name: 'description', description: 'New description.', required: false, type: 'string' },
        ],
        run: async (args, ctx) => {
            const fields: { name?: string; description?: string } = {};
            if (args['name'] !== undefined) fields.name = args['name'] as string;
            if (args['description'] !== undefined) fields.description = args['description'] as string;
            return ctx.services.document.update(args['id'] as string, fields);
        },
    },
    {
        resource: 'document',
        action: 'add-link',
        description: 'Link a document to an entity record.',
        flags: [
            { name: 'document-id', description: 'Document id.', required: true, type: 'string' },
            { name: 'entity-id', description: 'Entity id.', required: true, type: 'string' },
            { name: 'record-id', description: 'Record id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.document.addLink(
            args['document-id'] as string,
            args['entity-id'] as string,
            args['record-id'] as string,
        ),
    },
    {
        resource: 'document',
        action: 'remove-link',
        description: 'Remove a document <-> record link.',
        flags: [
            { name: 'document-id', description: 'Document id.', required: true, type: 'string' },
            { name: 'entity-id', description: 'Entity id.', required: true, type: 'string' },
            { name: 'record-id', description: 'Record id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.document.removeLink(
            args['document-id'] as string,
            args['entity-id'] as string,
            args['record-id'] as string,
        ),
    },
    {
        resource: 'document',
        action: 'get-file',
        description: 'Write the raw file bytes for a document to --out or stdout if omitted.',
        flags: [
            { name: 'id', description: 'Document id.', required: true, type: 'string' },
            { name: 'out', description: 'Output file path; if omitted, bytes are written to stdout.', required: false, type: 'file-path' },
        ],
        run: async (args, ctx) => {
            const buffer = await ctx.services.document.getFileBuffer(args['id'] as string);
            const outPath = args['out'] as string | undefined;
            if (outPath) {
                fs.writeFileSync(outPath, buffer);
                return { ok: true, bytes: buffer.length, path: outPath };
            }
            process.stdout.write(buffer);
            // Returning undefined would print {ok:true} via output.ts, but for
            // raw byte mode we have already written to stdout. Signal that the
            // caller should skip JSON output.
            return null;
        },
    },
];
