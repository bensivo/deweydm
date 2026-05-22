import { CommandDefinition } from './types';

export const columnVisibilityCommands: CommandDefinition[] = [
    {
        resource: 'column-visibility',
        action: 'get',
        description: 'Get column visibility settings for a (context-type, context-id) pair.',
        flags: [
            { name: 'context-type', description: 'Context type (e.g. entity, view).', required: true, type: 'string' },
            { name: 'context-id', description: 'Context id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.columnVisibility.get(
            args['context-type'] as string,
            args['context-id'] as string,
        ),
    },
    {
        resource: 'column-visibility',
        action: 'set',
        description: 'Set column visibility (visible field ids) for a context.',
        flags: [
            { name: 'context-type', description: 'Context type.', required: true, type: 'string' },
            { name: 'context-id', description: 'Context id.', required: true, type: 'string' },
            { name: 'field-ids', description: 'Comma-separated list of visible field ids.', required: true, type: 'csv' },
        ],
        run: async (args, ctx) => ctx.services.columnVisibility.set(
            args['context-type'] as string,
            args['context-id'] as string,
            args['field-ids'] as string[],
        ),
    },
];
