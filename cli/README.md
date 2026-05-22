# Dewey CLI

A command-line interface for Dewey DM. Talks directly to the same SQLite database used by the Electron app by reusing the service classes in `electron/src/service/`.

Intended for:
- Scripted / automated workflows (shell pipelines).
- AI agents using the CLI as a tool / skill — commands and flags are self-describing via `--help`.

## Install / Build

```bash
cd cli
npm install
npm run build
```

This produces JS in `cli/dist/`. The `bin/dewey` shim launches `dist/cli/src/index.js`.

You can run the CLI either via:

```bash
./bin/dewey <resource> <action> ...
# or
npm run dewey -- <resource> <action> ...
```

## Database Location

By default the CLI uses the same SQLite file as the Electron app. The default path is the platform's Electron `userData` directory:

- macOS: `~/Library/Application Support/Electron/db/dewey.db` (dev) or `~/Library/Application Support/PDMS/db/dewey.db` (packaged).
- Linux: `~/.config/Electron/db/dewey.db` or `~/.config/PDMS/db/dewey.db`.
- Windows: `%APPDATA%/Electron/db/dewey.db` or `%APPDATA%/PDMS/db/dewey.db`.

The CLI prefers whichever path already exists; otherwise it creates a new DB at the `Electron/` path.

Override with `--db-path <path>` or the `DEWEY_DB_PATH` env var. Override the documents directory with `--documents-dir <path>` or `DEWEY_DOCUMENTS_DIR`.

If the DB file does not exist, the CLI creates it and runs all migrations on first use (matching Electron behavior).

## Usage

```bash
dewey [global-flags] <resource> <action> [--flag value ...]
```

Global flags:
- `--db-path <path>`
- `--documents-dir <path>`
- `--output <json|json-pretty>` (default `json`)
- `--help`, `-h`

All successful commands emit JSON to stdout. Errors emit `{"error":"..."}` to stderr with a non-zero exit status (1 for validation errors, 2 for runtime errors).

### Discovery

```bash
dewey help
dewey <resource> help
dewey <resource> <action> --help
```

### Examples

```bash
# List workspaces
dewey workspace get-all

# Create a workspace
dewey workspace create --name "Personal"

# Create an entity
dewey entity create --name Project --plural-name Projects --workspace-id default

# Add a field
dewey entity add-field --entity-id <id> --field-name Title --field-type short-text

# Create a record using an inline JSON data object
dewey entity-record create --entity-id <id> --data '{"<field-id>":"Hello"}'

# Or read the data object from a file
dewey entity-record create --entity-id <id> --data-file ./record.json

# Upload a document linked to a record
dewey document create --name "Spec" --description "v1" --file ./spec.pdf
dewey document add-link --document-id <doc-id> --entity-id <e> --record-id <r>

# Pull the raw bytes back out
dewey document get-file --id <doc-id> --out ./out.pdf
```
