# Dewey CLI

Command-line interface for Dewey DM. Binary lives at `./cli/bin/dewey`.

## Global options

| Option | Description |
|---|---|
| `--db-path <path>` | Path to the SQLite database file. |
| `--documents-dir <path>` | Path to the documents directory. |
| `--output <mode>` | Output format: `json` (default) or `json-pretty`. |
| `-h, --help` | Show help. |

All commands print JSON to stdout.

## workspace

| Command | Options |
|---|---|
| `get-all` | — |
| `create` | `--name <name>` |
| `delete` | `--id <id>` |
| `set-default` | `--id <id>` |

## entity

| Command | Options |
|---|---|
| `get-all` | `--workspace-id [id]` |
| `get-by-id` | `--id <id>` |
| `create` | `--name <name>` `--plural-name <name>` `--workspace-id [id]` |
| `delete` | `--id <id>` |
| `set-display-name-field` | `--entity-id <id>` `--field-id <id>` |
| `add-field` | `--entity-id <id>` `--field-name <name>` `--field-type <type>` `--reference-entity-id [id]` `--backlink-source-entity-id [id]` `--backlink-source-field-id [id]` `--option-values [csv]` |
| `remove-field` | `--entity-id <id>` `--field-id <id>` |
| `reorder-fields` | `--entity-id <id>` `--ordered-field-ids <csv>` |

Field types: `short-text`, `long-text`, `number`, `reference`, `reference-list`, `backlink`, `option`.

## entity-record

| Command | Options |
|---|---|
| `get-all` | — |
| `get-by-id` | `--id <id>` |
| `get-by-entity-id` | `--entity-id <id>` |
| `create` | `--entity-id <id>` `--data [json]` \| `--data-file [path]` |
| `update` | `--id <id>` `--data [json]` \| `--data-file [path]` (replaces data) |
| `delete` | `--id <id>` |

`data` is a JSON object mapping `fieldId -> value`.

## column-visibility

| Command | Options |
|---|---|
| `get` | `--context-type <type>` `--context-id <id>` |
| `set` | `--context-type <type>` `--context-id <id>` `--field-ids <csv>` |

Context type is e.g. `entity` or `view`.

## document

| Command | Options |
|---|---|
| `get-all` | `--workspace-id [id]` |
| `get-by-id` | `--id <id>` |
| `create` | `--name <name>` `--description <desc>` `--file <path>` `--workspace-id [id]` |
| `update` | `--id <id>` `--name [name]` `--description [desc]` |
| `delete` | `--id <id>` |
| `add-link` | `--document-id <id>` `--entity-id <id>` `--record-id <id>` |
| `remove-link` | `--document-id <id>` `--entity-id <id>` `--record-id <id>` |
| `get-file` | `--id <id>` `--out [path]` (stdout if omitted) |

`originalFileName` and `mimeType` are derived from the uploaded file path.

## note

| Command | Options |
|---|---|
| `get-all` | `--workspace-id [id]` |
| `get-by-id` | `--id <id>` |
| `create` | `--name <name>` `--description <desc>` `--workspace-id [id]` + content flags |
| `update` | `--id <id>` `--name [name]` `--description [desc]` + content flags |
| `delete` | `--id <id>` |
| `add-link` | `--note-id <id>` `--entity-id <id>` `--record-id <id>` |
| `remove-link` | `--note-id <id>` `--entity-id <id>` `--record-id <id>` |

Content flags (pick one): `--content-json [str]`, `--content-json-file [path]`, `--content-text [str]`, `--content-text-file [path]`.

## view

| Command | Options |
|---|---|
| `get-all` | `--workspace-id [id]` |
| `create` | `--id <id>` `--name <name>` `--entity-id <id>` `--filters <json>` `--order-by <json>` `--workspace-id [id]` |
| `delete` | `--id <id>` |

`filters` and `order-by` are JSON arrays. The view `id` is caller-supplied.

## Examples

```sh
# List workspaces
./cli/bin/dewey --output json-pretty workspace get-all

# Create an entity and a record
./cli/bin/dewey entity create --name Project --plural-name Projects --workspace-id <wsId>
./cli/bin/dewey entity add-field --entity-id <eId> --field-name Title --field-type short-text
./cli/bin/dewey entity-record create --entity-id <eId> --data '{"<fieldId>":"My project"}'

# Upload and link a document
./cli/bin/dewey document create --name Spec --description "" --file ./spec.pdf --workspace-id <wsId>
./cli/bin/dewey document add-link --document-id <docId> --entity-id <eId> --record-id <recId>
```
