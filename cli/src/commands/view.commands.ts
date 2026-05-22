import { CommandDefinition } from './types';
import { Filter, OrderBy } from '../../../electron/src/service/view.service';

export const viewCommands: CommandDefinition[] = [
    {
        resource: 'view',
        action: 'get-all',
        description: 'List views, optionally scoped to a workspace.',
        flags: [
            { name: 'workspace-id', description: 'Workspace id.', required: false, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.view.getAll(args['workspace-id'] as string | undefined),
    },
    {
        resource: 'view',
        action: 'create',
        description: 'Create a saved view.',
        flags: [
            { name: 'id', description: 'View id (caller-supplied).', required: true, type: 'string' },
            { name: 'name', description: 'View name.', required: true, type: 'string' },
            { name: 'entity-id', description: 'Entity id this view belongs to.', required: true, type: 'string' },
            { name: 'filters', description: 'JSON array of filter objects.', required: true, type: 'json' },
            { name: 'order-by', description: 'JSON array of order-by objects.', required: true, type: 'json' },
            { name: 'workspace-id', description: 'Workspace id.', required: false, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.view.create(
            args['id'] as string,
            args['name'] as string,
            args['entity-id'] as string,
            args['filters'] as Filter[],
            args['order-by'] as OrderBy[],
            args['workspace-id'] as string | undefined,
        ),
    },
    {
        resource: 'view',
        action: 'delete',
        description: 'Delete a view.',
        flags: [
            { name: 'id', description: 'View id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.view.delete(args['id'] as string),
    },
];
