import { ProviderError } from '../errors/provider.error.ts';
import type { OpenAiResponse } from '../types/provider.types.ts';
import type { Validator } from '../types/validator.types.ts';
import { isRecord } from '../helper.ts';

export class OpenAiResponseValidator implements Validator<OpenAiResponse> {
  validate(value: unknown): asserts value is OpenAiResponse {
    if (!isRecord(value) || value.status !== 'completed') {
      throw new ProviderError('api_incomplete', 'The API response did not complete.');
    }
  }
}
