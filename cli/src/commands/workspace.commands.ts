import { CommandDefinition } from './types';

export const workspaceCommands: CommandDefinition[] = [
    {
        resource: 'workspace',
        action: 'get-all',
        description: 'List all workspaces.',
        flags: [],
        run: async (_args, ctx) => ctx.services.workspace.getAll(),
    },
    {
        resource: 'workspace',
        action: 'create',
        description: 'Create a new workspace.',
        flags: [
            { name: 'name', description: 'Workspace display name.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.workspace.create(args['name'] as string),
    },
    {
        resource: 'workspace',
        action: 'delete',
        description: 'Delete a workspace by id.',
        flags: [
            { name: 'id', description: 'Workspace id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.workspace.delete(args['id'] as string),
    },
    {
        resource: 'workspace',
        action: 'set-default',
        description: 'Mark a workspace as the default workspace.',
        flags: [
            { name: 'id', description: 'Workspace id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.workspace.setDefault(args['id'] as string),
    },
];
