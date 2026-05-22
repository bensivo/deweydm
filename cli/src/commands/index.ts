import { CommandDefinition } from './types';
import { workspaceCommands } from './workspace.commands';
import { entityCommands } from './entity.commands';
import { entityRecordCommands } from './entity-record.commands';
import { columnVisibilityCommands } from './column-visibility.commands';
import { documentCommands } from './document.commands';
import { noteCommands } from './note.commands';
import { viewCommands } from './view.commands';

/**
 * Flat list of every registered command. The runtime dispatcher matches by
 * (resource, action). Order here drives the order in `dewey help`.
 */
export const allCommands: CommandDefinition[] = [
    ...workspaceCommands,
    ...entityCommands,
    ...entityRecordCommands,
    ...columnVisibilityCommands,
    ...documentCommands,
    ...noteCommands,
    ...viewCommands,
];

export function findCommand(resource: string, action: string): CommandDefinition | undefined {
    return allCommands.find(c => c.resource === resource && c.action === action);
}

export function listResources(): string[] {
    const set = new Set<string>();
    for (const c of allCommands) set.add(c.resource);
    return Array.from(set);
}

export function commandsForResource(resource: string): CommandDefinition[] {
    return allCommands.filter(c => c.resource === resource);
}
