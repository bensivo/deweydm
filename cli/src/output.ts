export type OutputMode = 'json' | 'json-pretty';

/**
 * Writes a successful command result to stdout as JSON.
 * `void` results are serialized as `{ ok: true }`.
 */
export function printResult(value: unknown, mode: OutputMode): void {
    const payload = value === undefined ? { ok: true } : value;
    const text = mode === 'json-pretty' ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
    process.stdout.write(text + '\n');
}

/**
 * Writes an error as JSON to stderr.
 */
export function printError(err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    const payload = { error: message };
    process.stderr.write(JSON.stringify(payload) + '\n');
}
