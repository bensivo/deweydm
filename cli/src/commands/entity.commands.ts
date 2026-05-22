import { CommandDefinition } from './types';
import { FieldType } from '../../../electron/src/service/entity.service';

export const entityCommands: CommandDefinition[] = [
    {
        resource: 'entity',
        action: 'get-all',
        description: 'List all entities, optionally scoped to a workspace.',
        flags: [
            { name: 'workspace-id', description: 'Workspace id to scope results.', required: false, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.entity.getAll(args['workspace-id'] as string | undefined),
    },
    {
        resource: 'entity',
        action: 'get-by-id',
        description: 'Fetch an entity definition by id.',
        flags: [
            { name: 'id', description: 'Entity id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.entity.getById(args['id'] as string),
    },
    {
        resource: 'entity',
        action: 'create',
        description: 'Create a new entity definition.',
        flags: [
            { name: 'name', description: 'Singular entity name.', required: true, type: 'string' },
            { name: 'plural-name', description: 'Plural entity name.', required: true, type: 'string' },
            { name: 'workspace-id', description: 'Workspace id to assign.', required: false, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.entity.createEntity(
            args['name'] as string,
            args['plural-name'] as string,
            args['workspace-id'] as string | undefined,
        ),
    },
    {
        resource: 'entity',
        action: 'delete',
        description: 'Delete an entity.',
        flags: [
            { name: 'id', description: 'Entity id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.entity.deleteEntity(args['id'] as string),
    },
    {
        resource: 'entity',
        action: 'set-display-name-field',
        description: 'Set which field is used as the display name for records of this entity.',
        flags: [
            { name: 'entity-id', description: 'Entity id.', required: true, type: 'string' },
            { name: 'field-id', description: 'Field id to use as display name.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.entity.setDisplayNameField(
            args['entity-id'] as string,
            args['field-id'] as string,
        ),
    },
    {
        resource: 'entity',
        action: 'add-field',
        description: 'Add a field to an entity.',
        flags: [
            { name: 'entity-id', description: 'Entity id.', required: true, type: 'string' },
            { name: 'field-name', description: 'Field name.', required: true, type: 'string' },
            { name: 'field-type', description: 'short-text|long-text|number|reference|reference-list|backlink|option', required: true, type: 'string' },
            { name: 'reference-entity-id', description: 'Target entity id for reference fields.', required: false, type: 'string' },
            { name: 'backlink-source-entity-id', description: 'Source entity id for backlink fields.', required: false, type: 'string' },
            { name: 'backlink-source-field-id', description: 'Source field id for backlink fields.', required: false, type: 'string' },
            { name: 'option-values', description: 'Comma-separated option values for option fields.', required: false, type: 'csv' },
        ],
        run: async (args, ctx) => ctx.services.entity.addField(
            args['entity-id'] as string,
            args['field-name'] as string,
            args['field-type'] as FieldType,
            args['reference-entity-id'] as string | undefined,
            args['backlink-source-entity-id'] as string | undefined,
            args['backlink-source-field-id'] as string | undefined,
            args['option-values'] as string[] | undefined,
        ),
    },
    {
        resource: 'entity',
        action: 'remove-field',
        description: 'Remove a field from an entity.',
        flags: [
            { name: 'entity-id', description: 'Entity id.', required: true, type: 'string' },
            { name: 'field-id', description: 'Field id.', required: true, type: 'string' },
        ],
        run: async (args, ctx) => ctx.services.entity.removeField(
            args['entity-id'] as string,
            args['field-id'] as string,
        ),
    },
    {
        resource: 'entity',
        action: 'reorder-fields',
        description: 'Reorder the fields of an entity.',
        flags: [
            { name: 'entity-id', description: 'Entity id.', required: true, type: 'string' },
            { name: 'ordered-field-ids', description: 'Comma-separated field ids in the desired order.', required: true, type: 'csv' },
        ],
        run: async (args, ctx) => ctx.services.entity.reorderFields(
            args['entity-id'] as string,
            args['ordered-field-ids'] as string[],
        ),
    },
];
