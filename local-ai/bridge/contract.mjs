/**
 * A provider implements generate(prompt, { signal }) and returns:
 * { text, model, requestId?, usage?: { input, cachedInput?, output } }.
 * Tokens are observations, never subscription prices. Each adapter owns auth.
 * The service owns validation, idempotency, persistence and Langfuse tracing.
 */
export class ProviderError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
export function validateInput(body) {
  if (!body || typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 16000)
    throw new ProviderError('invalid_input', 'Prompt must contain 1–16000 characters.');
  if (typeof body.requestId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(body.requestId))
    throw new ProviderError('invalid_input', 'Provide a unique requestId (8–100 letters, digits, underscores or hyphens).');
  return { prompt: body.prompt, requestId: body.requestId };
}
export function validateResult(result) {
  if (!result || typeof result.text !== 'string' || !result.text.trim() || typeof result.model !== 'string')
    throw new ProviderError('invalid_output', 'The provider returned no usable text.');
  return result;
}
