import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const DEFAULT_TIMEOUT_MS = 1_800_000;
export const MAX_TIMEOUT_MS = 3_600_000;
export const HTTP_REQUEST_TIMEOUT_MS = 120_000;
export const MAX_HTTP_BODY_BYTES = 65_536;
export const HTTP_ERROR_STATUSES: Record<string, number> = { busy: 429, disabled: 503, invalid_input: 400 };
export const MAX_CODEX_OUTPUT_BYTES = 33_554_432;
export const OPENAI_MAX_OUTPUT_TOKENS = 1024;
export const OPENAI_HTTP_ERROR_CODES: Record<number, string> = { 401: 'authentication', 429: 'quota_or_rate_limit' };
export const TRACE_REQUEST_TIMEOUT_MS = 5_000;
