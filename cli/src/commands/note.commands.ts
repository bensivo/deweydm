import * as fs from 'fs';
import { CommandDefinition } from './types';

/**
 * Resolves either --content-json or --content-json-file. Returns the raw
 * string (no parsing — NoteService stores it as-is).
 */
function resolveContent(args: Record<string, unknown>, valueKey: string, fileKey: string): string | undefined {
    if (args[valueKey] !== undefined) {
        const v = args[valueKey];
        return typeof v === 'string' ? v : JSON.stringify(v);
    }
    if (args[fileKey] !== undefined) {
        return fs.readFileSync(args[fileKey] as string, 'utf8');
    }
    return undefined;
}

export const noteCommands: CommandDefinition[] = [
    {
        resource: 'note',
        action: 'get-all',
        description: 'List notes, optionally scoped to a workspace.',
        flags: [
            { name: 'workspace-id', description: 'Workspace id.', required: false, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.note.getAll(args['workspace-id'] as string | undefined),
    },
    {
        resource: 'note',
        action: 'get-by-id',
        description: 'Fetch a single note by id.',
        flags: [
            { name: 'id', description: 'Note id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => (await ctx.services.note.getById(args['id'] as string)) ?? null,
    },
    {
        resource: 'note',
        action: 'create',
        description: 'Create a new note.',
        flags: [
            { name: 'name', description: 'Name.', required: true, type: 'string' },
            { name: 'description', description: 'Description.', required: true, type: 'string' },
            { name: 'content-json', description: 'JSON-encoded note content (raw string).', required: false, type: 'string' },
            { name: 'content-json-file', description: 'Path to a file containing JSON content.', required: false, type: 'file-path' },
            { name: 'content-text', description: 'Plain text content.', required: false, type: 'string' },
            { name: 'content-text-file', description: 'Path to a file containing plain text content.', required: false, type: 'file-path' },
            { name: 'workspace-id', description: 'Workspace id.', required: false, type: 'string' },
        ],
        run: async (args, ctx) => {
            const contentJson = resolveContent(args, 'content-json', 'content-json-file') ?? '';
            const contentText = resolveContent(args, 'content-text', 'content-text-file') ?? '';
            return ctx.services.note.create(
                args['name'] as string,
                args['description'] as string,
                contentJson,
                contentText,
                args['workspace-id'] as string | undefined,
            );
        },
    },
    {
        resource: 'note',
        action: 'update',
        description: 'Update a note. All update flags are optional.',
        flags: [
            { name: 'id', description: 'Note id.', required: true, type: 'string' },
            { name: 'name', description: 'New name.', required: false, type: 'string' },
            { name: 'description', description: 'New description.', required: false, type: 'string' },
            { name: 'content-json', description: 'JSON-encoded note content (raw string).', required: false, type: 'string' },
            { name: 'content-json-file', description: 'Path to a file containing JSON content.', required: false, type: 'file-path' },
            { name: 'content-text', description: 'Plain text content.', required: false, type: 'string' },
            { name: 'content-text-file', description: 'Path to a file containing plain text content.', required: false, type: 'file-path' },
        ],
        run: async (args, ctx) => {
            const fields: { name?: string; description?: string; contentJson?: string; contentText?: string } = {};
            if (args['name'] !== undefined) fields.name = args['name'] as string;
            if (args['description'] !== undefined) fields.description = args['description'] as string;
            const cj = resolveContent(args, 'content-json', 'content-json-file');
            if (cj !== undefined) fields.contentJson = cj;
            const ct = resolveContent(args, 'content-text', 'content-text-file');
            if (ct !== undefined) fields.contentText = ct;
            return ctx.services.note.update(args['id'] as string, fields);
        },
    },
    {
        resource: 'note',
        action: 'delete',
        description: 'Delete a note.',
        flags: [
            { name: 'id', description: 'Note id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.note.delete(args['id'] as string),
    },
    {
        resource: 'note',
        action: 'add-link',
        description: 'Link a note to an entity record.',
        flags: [
            { name: 'note-id', description: 'Note id.', required: true, type: 'string' },
            { name: 'entity-id', description: 'Entity id.', required: true, type: 'string' },
            { name: 'record-id', description: 'Record id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.note.addLink(
            args['note-id'] as string,
            args['entity-id'] as string,
            args['record-id'] as string,
        ),
    },
    {
        resource: 'note',
        action: 'remove-link',
        description: 'Remove a note <-> record link.',
        flags: [
            { name: 'note-id', description: 'Note id.', required: true, type: 'string' },
            { name: 'entity-id', description: 'Entity id.', required: true, type: 'string' },
            { name: 'record-id', description: 'Record id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.note.removeLink(
            args['note-id'] as string,
            args['entity-id'] as string,
            args['record-id'] as string,
        ),
    },
];
