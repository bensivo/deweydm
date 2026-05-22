# Dewey CLI Tool

## Overview

A new top-level Node.js project at `cli/` that exposes Dewey's core data operations as a command-line interface. The CLI talks directly to the same SQLite database used by the Electron app, by reusing the existing service classes in `electron/src/service/`. It is intended for:

- Programmatic / scripted use (shell pipelines, automation).
- AI agents using the CLI as a tool / skill (commands and flags should be discoverable and self-describing).

The command surface mirrors the IPC handlers in `electron/src/ipc-handlers.ts` so anything the Electron app can do, the CLI can do too.

## Goals

- Implement every IPC handler as a CLI command.
- Reuse `EntityService`, `EntityRecordService`, `WorkspaceService`, `ColumnVisibilityService`, `DocumentService`, `NoteService`, and `ViewService` directly. Do not duplicate business logic.
- AWS-CLI-style invocation: `dewey <resource> <action> --flag value --flag value`.
- Output JSON to stdout for programmatic consumption.
- Zero external dependencies beyond what is already used (`sqlite3`, plus dev `typescript` and `@types/node`). No commander/yargs/chalk. We will write a tiny in-house arg parser.

## Non-Goals

- No interactive prompts, no TUI, no colored output.
- Not packaged for npm distribution yet (just runnable locally via `npm run dewey -- ...` and a `bin` script).
- No remote DB / API mode. SQLite file only.

## Project Structure

```
cli/
  package.json
  tsconfig.json
  README.md
  bin/
    dewey                 # shell shim: node ../dist/index.js "$@"
  src/
    index.ts              # entry point: parse argv, dispatch
    db.ts                 # opens sqlite DB, runs migrations (reuses electron migration code)
    arg-parser.ts         # parses --flag value style args into a map
    output.ts             # writes JSON results / errors to stdout/stderr
    commands/
      index.ts            # registry: maps "resource action" -> handler
      workspace.commands.ts
      entity.commands.ts
      entity-record.commands.ts
      column-visibility.commands.ts
      document.commands.ts
      note.commands.ts
      view.commands.ts
  dist/                   # tsc output
```

## Database Location

The Electron app stores the DB at `app.getPath('userData')/db/dewey.db`. The CLI cannot import `electron`, so it must compute this path independently. Approach:

- Default DB path is the platform-equivalent of Electron's `userData` for the app id `PDMS` / `dewey-dm`:
  - macOS: `~/Library/Application Support/Electron/db/dewey.db` (matches dev electron behavior) or `~/Library/Application Support/PDMS/db/dewey.db` (matches packaged build).
  - Linux: `~/.config/Electron/db/dewey.db` or `~/.config/PDMS/db/dewey.db`.
  - Windows: `%APPDATA%/Electron/db/dewey.db` or `%APPDATA%/PDMS/db/dewey.db`.
- Allow override via `--db-path <file>` global flag or `DEWEY_DB_PATH` env var.
- Documents directory similarly defaulted, overridable via `--documents-dir` / `DEWEY_DOCUMENTS_DIR`.

Implementation note: extract the migration logic from `electron/src/db.ts` so the CLI can reuse it. Either:
- (Preferred) Move `runMigrations` into a shared file the CLI imports relatively, e.g. `electron/src/db.ts` exports `runMigrations`, and the CLI imports via relative path `../../electron/src/db`. The CLI's `tsconfig.json` includes `../electron/src/**/*` as additional source roots.
- This avoids publishing a separate shared package and keeps the schema single-sourced.

## Reusing Services

The CLI will import service classes via relative paths from `electron/src/service/`. The CLI `tsconfig.json` will set `rootDir` to the parent and include both `src/**/*` and `../electron/src/**/*`. Output goes to `cli/dist/`.

No service code changes are required. The services only depend on `sqlite3` (for entity/record/view/note/workspace/column-visibility) or `sqlite3` plus a documents directory (for `DocumentService`).

## Command Surface

Format: `dewey <resource> <action> [--flag value ...]`

Global flags (parsed before the resource):
- `--db-path <path>`
- `--documents-dir <path>`
- `--output <json|json-pretty>` (default `json`)
- `--help` / `-h`

### workspace
- `dewey workspace get-all`
- `dewey workspace create --name <name>`
- `dewey workspace delete --id <id>`
- `dewey workspace set-default --id <id>`

### entity
- `dewey entity get-all [--workspace-id <id>]`
- `dewey entity get-by-id --id <id>`
- `dewey entity create --name <n> --plural-name <pn> [--workspace-id <id>]`
- `dewey entity delete --id <id>`
- `dewey entity set-display-name-field --entity-id <id> --field-id <id>`
- `dewey entity add-field --entity-id <id> --field-name <n> --field-type <t> [--reference-entity-id <id>] [--backlink-source-entity-id <id>] [--backlink-source-field-id <id>] [--option-values <csv>]`
- `dewey entity remove-field --entity-id <id> --field-id <id>`
- `dewey entity reorder-fields --entity-id <id> --ordered-field-ids <csv>`

### entity-record
- `dewey entity-record get-all`
- `dewey entity-record get-by-id --id <id>`
- `dewey entity-record get-by-entity-id --entity-id <id>`
- `dewey entity-record create --entity-id <id> --data <json>`
- `dewey entity-record update --id <id> --data <json>`
- `dewey entity-record delete --id <id>`

`--data` accepts a JSON object string, e.g. `--data '{"field-id-1":"value","field-id-2":"value"}'`. Also accept `--data-file <path>` to read from a JSON file (useful for large records / agent ergonomics).

### column-visibility
- `dewey column-visibility get --context-type <t> --context-id <id>`
- `dewey column-visibility set --context-type <t> --context-id <id> --field-ids <csv>`

### document
- `dewey document get-all [--workspace-id <id>]`
- `dewey document get-by-id --id <id>`
- `dewey document create --name <n> --description <d> --file <path> [--workspace-id <id>]`
  - reads file from disk, derives `originalFileName` from path, derives `mimeType` from extension (simple lookup table; default `application/octet-stream`).
- `dewey document delete --id <id>`
- `dewey document update --id <id> [--name <n>] [--description <d>]`
- `dewey document add-link --document-id <id> --entity-id <id> --record-id <id>`
- `dewey document remove-link --document-id <id> --entity-id <id> --record-id <id>`
- `dewey document get-file --id <id> [--out <path>]` — writes raw file bytes; defaults to stdout if `--out` omitted.

### note
- `dewey note get-all [--workspace-id <id>]`
- `dewey note get-by-id --id <id>`
- `dewey note create --name <n> --description <d> --content-json <json> --content-text <text> [--workspace-id <id>]`
  - Also `--content-json-file <path>` and `--content-text-file <path>` variants.
- `dewey note update --id <id> [--name <n>] [--description <d>] [--content-json <json>] [--content-text <text>]`
- `dewey note delete --id <id>`
- `dewey note add-link --note-id <id> --entity-id <id> --record-id <id>`
- `dewey note remove-link --note-id <id> --entity-id <id> --record-id <id>`

### view
- `dewey view get-all [--workspace-id <id>]`
- `dewey view create --id <id> --name <n> --entity-id <id> --filters <json> --order-by <json> [--workspace-id <id>]`
- `dewey view delete --id <id>`

### help / discovery
- `dewey help` — lists all resources and actions.
- `dewey <resource> help` — lists all actions for a resource with their flags.
- `dewey <resource> <action> --help` — describes a single command with its flags, required vs optional, and types. Generated from the command registry metadata.

## Command Registry

Each command is registered as an object so help text is generated, not hand-maintained:

```ts
interface CommandDefinition {
    resource: string;
    action: string;
    description: string;
    flags: FlagDefinition[];
    run: (args: Record<string, string>, ctx: CommandContext) => Promise<unknown>;
}

interface FlagDefinition {
    name: string;          // e.g. 'workspace-id'
    description: string;
    required: boolean;
    type: 'string' | 'number' | 'json' | 'csv' | 'file-path';
}

interface CommandContext {
    db: sqlite3.Database;
    documentsDir: string;
    services: {
        workspace: WorkspaceService;
        entity: EntityService;
        entityRecord: EntityRecordService;
        columnVisibility: ColumnVisibilityService;
        document: DocumentService;
        note: NoteService;
        view: ViewService;
    };
}
```

`index.ts` builds the registry, parses argv, instantiates services, dispatches, and prints the JSON result (or error). Process exits with `0` on success, `1` on validation error, `2` on runtime error.

## Argument Parser (`arg-parser.ts`)

Minimal: walk argv, recognize `--flag value` and `--flag=value`. Boolean flags via presence. Reject unknown flags when a command is matched. Coerce types based on flag definitions:
- `string` -> pass through
- `number` -> `Number(v)`, NaN check
- `json` -> `JSON.parse(v)`
- `csv` -> `v.split(',').map(s => s.trim()).filter(Boolean)`
- `file-path` -> resolve to absolute path; for `document create` read file into Buffer

## Output

`output.ts`:
- `printResult(value: unknown, mode: 'json' | 'json-pretty')` -> stdout
- `printError(err: unknown)` -> stderr as `{ "error": "<message>" }` JSON, then non-zero exit

Successful commands always emit valid JSON to stdout. Commands that return `void` emit `{ "ok": true }`.

## Files To Create

- `cli/package.json` — name `dewey-cli`, `bin.dewey = ./bin/dewey`, scripts `build` (`tsc`), `dewey` (`node dist/index.js`). Dev dep on `typescript`, `@types/node`. Runtime dep on `sqlite3`.
- `cli/tsconfig.json` — `target: ES2022`, `module: commonjs`, `outDir: ./dist`, `rootDir: ..`, `include: ['src/**/*', '../electron/src/**/*']`, `strict: true`.
- `cli/bin/dewey` — shell shim: `#!/usr/bin/env node\nrequire('../dist/cli/src/index.js');` (adjust path per tsc output layout) or use `tsx` style direct script; pick the simplest one once tsc layout is known.
- `cli/src/index.ts` — entry, top-level error handling.
- `cli/src/db.ts` — resolves default DB path per platform, opens DB, calls `runMigrations` imported from `electron/src/db.ts`.
- `cli/src/arg-parser.ts`
- `cli/src/output.ts`
- `cli/src/commands/index.ts` — assembles registry from all command files.
- `cli/src/commands/workspace.commands.ts`
- `cli/src/commands/entity.commands.ts`
- `cli/src/commands/entity-record.commands.ts`
- `cli/src/commands/column-visibility.commands.ts`
- `cli/src/commands/document.commands.ts`
- `cli/src/commands/note.commands.ts`
- `cli/src/commands/view.commands.ts`
- `cli/README.md` — install (`npm install && npm run build`), invocation, examples, mention of `DEWEY_DB_PATH`.

## Files To Edit

- `electron/src/db.ts` — no functional change, but verify `runMigrations` is exported (it is). No edits required unless CLI tsconfig has issues compiling it (the file references `Electron.App`; the migration function itself does not, only `getDbPath`/`getDocumentsDir` do — those can be wrapped in `// @ts-ignore` or extracted later if needed). If problems arise, split `runMigrations` into a new file `electron/src/migrations.ts` with no `electron` imports.
- Root `README.md` — add a short section describing the CLI and pointing to `cli/README.md`.

## Implementation Order

1. Scaffold `cli/` with `package.json`, `tsconfig.json`, and an empty `src/index.ts` that prints `hello`. Build, confirm it runs.
2. Extract `runMigrations` from `electron/src/db.ts` into a standalone file if needed (no electron imports). Wire `cli/src/db.ts` to open a SQLite file and run migrations.
3. Implement `arg-parser.ts` and `output.ts`, plus the `CommandDefinition` interface and a help renderer.
4. Implement `workspace.commands.ts` end-to-end as the reference command set; verify with a manual test against a temp DB.
5. Fill in the remaining command files mirroring each IPC handler one-to-one.
6. Implement `document get-file` file-output path and `document create` file-input path.
7. Add `dewey help`, per-resource help, and per-command help generation from the registry.
8. Write `cli/README.md` and update root `README.md`.
9. Manual smoke test: create workspace, entity, fields, records; list; update; delete; create note and document linked to a record; query back.

## Open Questions / Decisions

- **DB path default**: confirm whether to target Electron's dev path (`Electron/db/dewey.db`) or the packaged-app path (`PDMS/db/dewey.db`). Lean toward checking both and using whichever exists, with `--db-path` override. Decide during implementation.
- **Auto-creating the DB**: if no DB exists at the resolved path, create it and run migrations (matching Electron behavior). Documented as such.
- **Stdin for `--data`**: optionally accept `--data -` to read JSON from stdin. Nice for piping. Defer to follow-up if it complicates the parser.
