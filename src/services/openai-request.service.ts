import { ProviderError } from '../errors/provider.error.ts';
import { OPENAI_HTTP_ERROR_CODES, OPENAI_MAX_OUTPUT_TOKENS } from '../config/keys.ts';
import type { OpenAiProviderOptions } from '../types/provider.types.ts';

export class OpenAiRequestService {
  async send(prompt: string, signal: AbortSignal, key: string, options: OpenAiProviderOptions): Promise<Response> {
    const fetchImpl = options.fetchImpl ?? fetch;
    let response: Response;
    try {
      response = await fetchImpl('https://api.openai.com/v1/responses', {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: options.model, input: prompt, max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS, store: false, tools: [] }),
      });
    } catch {
      throw new ProviderError(
        signal.aborted ? 'timeout' : 'network',
        'API request interrupted; remote outcome may be unknown. No automatic retry.',
      );
    }
    if (!response.ok) {
      throw new ProviderError(
        OPENAI_HTTP_ERROR_CODES[response.status] ?? 'api_error',
        `OpenAI API returned HTTP ${response.status}. No fallback was attempted.`,
      );
    }
    return response;
  }
}
