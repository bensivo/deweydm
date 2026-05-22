import { Command, Option } from 'commander';

import { printError, printResult, OutputMode } from './output';
import { openDatabase, resolveDefaultDbPath, resolveDefaultDocumentsDir, ensureDocumentsDir } from './db';
import { allCommands } from './commands';
import { CommandContext, CommandDefinition, FlagDefinition } from './commands/types';

import { WorkspaceService } from '../../electron/src/service/workspace.service';
import { EntityService } from '../../electron/src/service/entity.service';
import { EntityRecordService } from '../../electron/src/service/entity-record.service';
import { ColumnVisibilityService } from '../../electron/src/service/column-visibility.service';
import { DocumentService } from '../../electron/src/service/document.service';
import { NoteService } from '../../electron/src/service/note.service';
import { ViewService } from '../../electron/src/service/view.service';

interface GlobalOpts {
    dbPath?: string;
    documentsDir?: string;
    output?: OutputMode;
}

function coerce(flag: FlagDefinition, raw: string): unknown {
    switch (flag.type) {
        case 'string':
        case 'file-path':
            return raw;
        case 'number': {
            const n = Number(raw);
            if (Number.isNaN(n)) throw new Error(`--${flag.name} must be a number, got "${raw}"`);
            return n;
        }
        case 'json':
            try {
                return JSON.parse(raw);
            } catch (e) {
                throw new Error(`--${flag.name} must be valid JSON: ${(e as Error).message}`);
            }
        case 'csv':
            return raw.split(',').map(s => s.trim()).filter(Boolean);
        case 'boolean':
            return raw === 'true' || raw === '';
        default:
            return raw;
    }
}

async function runCommand(
    cmd: CommandDefinition,
    args: Record<string, unknown>,
    globals: GlobalOpts,
): Promise<void> {
    const outputMode: OutputMode = globals.output === 'json-pretty' ? 'json-pretty' : 'json';
    const dbPath = globals.dbPath ?? resolveDefaultDbPath();
    // console.log(`Using database at ${dbPath}`); 
    const documentsDir = globals.documentsDir ?? resolveDefaultDocumentsDir();
    ensureDocumentsDir(documentsDir);

    const db = await openDatabase(dbPath);
    try {
        const ctx: CommandContext = {
            db,
            documentsDir,
            services: {
                workspace: new WorkspaceService(db),
                entity: new EntityService(db),
                entityRecord: new EntityRecordService(db),
                columnVisibility: new ColumnVisibilityService(db),
                document: new DocumentService(db, documentsDir),
                note: new NoteService(db),
                view: new ViewService(db),
            },
        };
        const result = await cmd.run(args, ctx);
        // `null` is a sentinel from commands that wrote raw bytes to stdout
        // themselves (e.g. `document get-file` without --out).
        if (result !== null) {
            printResult(result, outputMode);
        }
    } finally {
        await new Promise<void>((resolve) => db.close(() => resolve()));
    }
}

function buildProgram(): Command {
    const program = new Command();
    program
        .name('dewey')
        .description('Command-line interface for Dewey DM')
        .option('--db-path <path>', 'Path to the SQLite database file')
        .option('--documents-dir <path>', 'Path to the documents directory')
        .addOption(
            new Option('--output <mode>', 'Output format').choices(['json', 'json-pretty']).default('json'),
        );

    // Group commands by resource so each resource is a subcommand with its
    // own nested action subcommands: `dewey <resource> <action>`.
    const byResource = new Map<string, CommandDefinition[]>();
    for (const cmd of allCommands) {
        const list = byResource.get(cmd.resource) ?? [];
        list.push(cmd);
        byResource.set(cmd.resource, list);
    }

    for (const [resource, cmds] of byResource) {
        const resourceCmd = program
            .command(resource)
            .description(`${resource} commands`);

        for (const def of cmds) {
            const action = resourceCmd
                .command(def.action)
                .description(def.description);

            for (const flag of def.flags) {
                const valueSpec = flag.required ? `<${flag.name}>` : `[${flag.name}]`;
                const optSpec = flag.type === 'boolean'
                    ? `--${flag.name}`
                    : `--${flag.name} ${valueSpec}`;
                const option = new Option(optSpec, flag.description);
                if (flag.required) option.makeOptionMandatory(true);
                if (flag.type !== 'boolean') {
                    option.argParser((raw: string) => coerce(flag, raw));
                }
                action.addOption(option);
            }

            action.action(async (...actionArgs: unknown[]) => {
                // commander passes (...positionalArgs, options, command)
                const opts = actionArgs[actionArgs.length - 2] as Record<string, unknown>;
                // commander camelCases option keys; convert back to the
                // kebab-case names the command handlers expect.
                const args: Record<string, unknown> = {};
                for (const flag of def.flags) {
                    const camel = flag.name.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
                    if (opts[camel] !== undefined) {
                        args[flag.name] = opts[camel];
                    }
                }
                const globals = program.opts() as {
                    dbPath?: string;
                    documentsDir?: string;
                    output?: OutputMode;
                };
                await runCommand(def, args, globals);
            });
        }
    }

    return program;
}

async function main(): Promise<void> {
    const program = buildProgram();
    await program.parseAsync(process.argv);
}

main().catch((err: Error & { code?: string }) => {
    printError(err);
    // commander's own validation errors set err.code starting with 'commander.'
    const isCommanderValidation = typeof err?.code === 'string' && err.code.startsWith('commander.');
    const message = err?.message ?? '';
    const isValidation = isCommanderValidation
        || /^(Missing required|Unknown |--[a-z-]+ must be)/.test(message);
    process.exit(isValidation ? 1 : 2);
});
