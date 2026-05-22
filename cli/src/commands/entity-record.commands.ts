import * as fs from 'fs';
import { CommandDefinition } from './types';

/**
 * Resolves the `--data` flag value, falling back to `--data-file`. Always
 * returns a `Record<string, string>` as expected by EntityRecordService.
 */
function resolveData(args: Record<string, unknown>): Record<string, string> {
    if (args['data'] !== undefined) {
        return args['data'] as Record<string, string>;
    }
    if (args['data-file'] !== undefined) {
        const filePath = args['data-file'] as string;
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    }
    throw new Error('Either --data <json> or --data-file <path> is required.');
}

export const entityRecordCommands: CommandDefinition[] = [
    {
        resource: 'entity-record',
        action: 'get-all',
        description: 'List every entity record across all entities.',
        flags: [],
        run: async (_args, ctx) => ctx.services.entityRecord.getAll(),
    },
    {
        resource: 'entity-record',
        action: 'get-by-id',
        description: 'Fetch a single entity record by id.',
        flags: [
            { name: 'id', description: 'Record id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.entityRecord.getById(args['id'] as string),
    },
    {
        resource: 'entity-record',
        action: 'get-by-entity-id',
        description: 'List records belonging to a specific entity.',
        flags: [
            { name: 'entity-id', description: 'Entity id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.entityRecord.getByEntityId(args['entity-id'] as string),
    },
    {
        resource: 'entity-record',
        action: 'create',
        description: 'Create a new entity record.',
        flags: [
            { name: 'entity-id', description: 'Entity id.', required: true, type: 'string' },
            { name: 'data', description: 'JSON object of fieldId -> value.', required: false, type: 'json' },
            { name: 'data-file', description: 'Path to a JSON file containing the data object.', required: false, type: 'file-path' },
        ],
        run: async (args, ctx) => ctx.services.entityRecord.createRecord(
            args['entity-id'] as string,
            resolveData(args),
        ),
    },
    {
        resource: 'entity-record',
        action: 'update',
        description: 'Update an entity record by id (replaces the data object).',
        flags: [
            { name: 'id', description: 'Record id.', required: true, type: 'string' },
            { name: 'data', description: 'JSON object of fieldId -> value.', required: false, type: 'json' },
            { name: 'data-file', description: 'Path to a JSON file containing the data object.', required: false, type: 'file-path' },
        ],
        run: async (args, ctx) => ctx.services.entityRecord.updateRecord(
            args['id'] as string,
            resolveData(args),
        ),
    },
    {
        resource: 'entity-record',
        action: 'delete',
        description: 'Delete an entity record.',
        flags: [
            { name: 'id', description: 'Record id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.entityRecord.deleteRecord(args['id'] as string),
    },
];
