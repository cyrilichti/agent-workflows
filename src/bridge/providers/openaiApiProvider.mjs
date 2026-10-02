import { readFileSync } from 'node:fs';
import { ProviderError } from '../execution/taskContract.mjs';

// https://developers.openai.com/api/docs/guides/text (Responses API).
/**
 * Normalize a completed Responses API payload into the shared task result.
 *
 * @param {object} body Parsed API response.
 * @param {string} model Fallback model label.
 * @returns {import('../execution/taskContract.mjs').TaskResult}
 * @throws {ProviderError} If the API response is incomplete.
 */
export function parseOpenAiResponse(body, model) {
  if (body.status !== 'completed') {
    throw new ProviderError('api_incomplete', 'The API response did not complete.');
  }
  const text = (body.output ?? [])
    .filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((content) => content.type === 'output_text')
    .map((content) => content.text)
    .join('\n');
  const providerUsage = body.usage;
  return {
    text,
    model: body.model ?? model,
    requestId: body.id,
    usage: providerUsage
      ? {
          input: providerUsage.input_tokens,
          cachedInput: providerUsage.input_tokens_details?.cached_tokens,
          output: providerUsage.output_tokens,
        }
      : undefined,
  };
}

/**
 * Create an API adapter using an explicit key or a key file.
 *
 * @param {object} options
 * @param {string} options.model API model identifier.
 * @param {string} [options.key] API key; takes precedence over the file.
 * @param {string} [options.keyFile] Fallback credential file.
 * @param {typeof fetch} [options.fetchImpl=fetch] Injectable HTTP client.
 * @returns {import('../execution/taskContract.mjs').AiProvider}
 */
export function createOpenAiApiProvider({
  model,
  key: configuredKey,
  keyFile = '/run/secrets/openai_api_key',
  fetchImpl = fetch,
}) {
  return {
    /**
     * Send one bounded Responses API request without retrying it.
     *
     * @param {string} prompt Task instructions.
     * @param {{ signal: AbortSignal }} options Cancellation and deadline signal.
     * @returns {Promise<import('../execution/taskContract.mjs').TaskResult>}
     * @throws {ProviderError} For execution, authentication, cancellation or provider failures.
     */
    async generate(prompt, { signal }) {
      let key = configuredKey?.trim();
      if (!key) {
        try {
          key = readFileSync(keyFile, 'utf8').trim();
        } catch {
          // Missing or unreadable credentials use the same safe authentication error below.
        }
      }
      if (!key) {
        throw new ProviderError(
          'authentication',
          'Set OPENAI_API_KEY in .env before enabling API inference.',
        );
      }
      let response;
      try {
        response = await fetchImpl('https://api.openai.com/v1/responses', {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model,
            input: prompt,
            max_output_tokens: 1024,
            store: false,
            tools: [],
          }),
        });
      } catch {
        throw new ProviderError(
          signal.aborted ? 'timeout' : 'network',
          'API request interrupted; remote outcome may be unknown. No automatic retry.',
        );
      }
      if (!response.ok) {
        const errorCodes = { 401: 'authentication', 429: 'quota_or_rate_limit' };
        const code = errorCodes[response.status] ?? 'api_error';
        throw new ProviderError(
          code,
          `OpenAI API returned HTTP ${response.status}. No fallback was attempted.`,
        );
      }
      return parseOpenAiResponse(await response.json(), model);
    },
  };
}
