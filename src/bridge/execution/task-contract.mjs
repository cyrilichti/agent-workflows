/**
 * @typedef {object} TaskInput
 * @property {string} requestId Correlation identifier supplied by the caller.
 * @property {string} prompt Task instructions.
 * @property {string} [directory] Per-call Codex working directory.
 * @property {number} [timeoutMs] Per-call execution deadline in milliseconds.
 */

/**
 * Observed token counts, never subscription prices.
 * @typedef {object} TokenUsage
 * @property {number} input Total input tokens, including cached tokens.
 * @property {number} output Output tokens.
 * @property {number} [cachedInput] Cached input tokens.
 */

/**
 * @typedef {object} TaskResult
 * @property {string} text Final response text.
 * @property {string} model Model identifier or configured-default label.
 * @property {string} [requestId] Provider-side request or thread identifier.
 * @property {TokenUsage} [usage] Observed usage when available.
 */

/**
 * Each adapter owns authentication; execution owns validation.
 * @typedef {object} AiProvider
 * @property {function(string, {signal: AbortSignal, directory?: string}): Promise<TaskResult>} generate
 */

/**
 * Outcome of one bridge execution, used to build its response and trace.
 * @typedef {object} TaskOutcome
 * @property {string} requestId Bridge request identifier.
 * @property {string} prompt Task instructions.
 * @property {string} provider Provider name.
 * @property {string} model Model identifier.
 * @property {'running' | 'completed' | 'failed' | 'unknown'} status Execution outcome.
 * @property {'accepted' | 'failed'} [traceStatus] One-shot delivery state.
 * @property {string} traceId Unique trace identifier for this execution.
 * @property {string} startedAt ISO timestamp.
 * @property {string} [endedAt] ISO timestamp.
 * @property {number} [durationMs] Elapsed execution time.
 * @property {string} [text] Final response text.
 * @property {{code: string, message: string}} [error] Safe failure details.
 * @property {TokenUsage} [usage] Observed provider usage.
 * @property {string} [providerRequestId] Provider-side identifier.
 */

/** An operational failure safe to expose to bridge clients. */
export class ProviderError extends Error {
  /**
   * Create an error whose code and message can be returned to bridge clients.
   *
   * @param {string} code Stable failure identifier.
   * @param {string} message Safe message without credentials or raw provider output.
   */
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/** Maximum supported execution deadline for configuration and individual calls. */
export const MAX_TIMEOUT_MS = 3600000;

/**
 * Validate task inputs without revalidating a directory resolved by the workflow.
 *
 * @param {unknown} body Untrusted HTTP request data.
 * @returns {TaskInput} Validated input, without extra request properties.
 * @throws {ProviderError} If the prompt or request identifier is invalid.
 */
export function validateTaskInput(body) {
  if (!body || typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 16000) {
    throw new ProviderError('invalid_input', 'Prompt must contain 1–16000 characters.');
  }
  if (typeof body.requestId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(body.requestId)) {
    throw new ProviderError(
      'invalid_input',
      'Provide a requestId (8–100 letters, digits, underscores or hyphens).',
    );
  }
  if (body.directory !== undefined && (typeof body.directory !== 'string' || !body.directory.trim())) {
    throw new ProviderError('invalid_input', 'directory must be a nonempty string.');
  }
  if (
    body.timeoutMs !== undefined &&
    (!Number.isInteger(body.timeoutMs) || body.timeoutMs < 1 || body.timeoutMs > MAX_TIMEOUT_MS)
  ) {
    throw new ProviderError('invalid_input', `timeoutMs must be 1–${MAX_TIMEOUT_MS}.`);
  }
  return {
    prompt: body.prompt,
    requestId: body.requestId,
    ...(body.directory !== undefined ? { directory: body.directory } : {}),
    ...(body.timeoutMs !== undefined ? { timeoutMs: body.timeoutMs } : {}),
  };
}

/**
 * Require a nonempty provider response before recording task completion.
 *
 * @param {unknown} result Provider output.
 * @returns {TaskResult} The accepted provider result.
 * @throws {ProviderError} If no usable text or model identifier was returned.
 */
export function validateTaskResult(result) {
  if (
    !result ||
    typeof result.text !== 'string' ||
    !result.text.trim() ||
    typeof result.model !== 'string'
  ) {
    throw new ProviderError('invalid_output', 'The provider returned no usable text.');
  }
  return result;
}
