import { ProviderError } from '../errors/provider.error.ts';
import type { OpenAiResponse } from '../types/provider.types.ts';
import type { Validator } from '../types/validator.types.ts';
import { isRecord } from '../helper.ts';

export class OpenAiResponseValidator implements Validator<OpenAiResponse> {
  validate(value: unknown): asserts value is OpenAiResponse {
    if (!isRecord(value) || value.status !== 'completed') {
      throw new ProviderError('api_incomplete', 'The API response did not complete.');
    }
    if (!Array.isArray(value.output) ||
        (value.model !== undefined && typeof value.model !== 'string') ||
        (value.id !== undefined && typeof value.id !== 'string')) {
      throw new ProviderError('invalid_output', 'The API response has invalid fields.');
    }
    for (const item of value.output) {
      if (!isRecord(item) || typeof item.type !== 'string' ||
          (item.content !== undefined && !Array.isArray(item.content))) {
        throw new ProviderError('invalid_output', 'The API response has invalid fields.');
      }
      for (const content of item.content ?? []) {
        if (!isRecord(content) || typeof content.type !== 'string' ||
            (content.text !== undefined && typeof content.text !== 'string')) {
          throw new ProviderError('invalid_output', 'The API response has invalid fields.');
        }
      }
    }
    const usage = value.usage;
    if (usage === undefined) return;
    if (!isRecord(usage) ||
        typeof usage.input_tokens !== 'number' || !Number.isSafeInteger(usage.input_tokens) || usage.input_tokens < 0 ||
        typeof usage.output_tokens !== 'number' || !Number.isSafeInteger(usage.output_tokens) || usage.output_tokens < 0) {
      throw new ProviderError('invalid_output', 'The API response has invalid fields.');
    }
    const details = usage.input_tokens_details;
    if (details !== undefined && (!isRecord(details) ||
        (details.cached_tokens !== undefined &&
          (typeof details.cached_tokens !== 'number' || !Number.isSafeInteger(details.cached_tokens) ||
            details.cached_tokens < 0 || details.cached_tokens > usage.input_tokens)))) {
      throw new ProviderError('invalid_output', 'The API response has invalid fields.');
    }
  }
}
