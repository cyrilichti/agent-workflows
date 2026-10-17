import { readFileSync } from 'node:fs';
import { ProviderError } from '../errors/provider.error.ts';
import type { OpenAiProviderOptions } from '../types/provider.types.ts';

export class OpenAiCredentialService {
  readKey(options: OpenAiProviderOptions): string {
    let key = options.key?.trim();
    if (!key) {
      try {
        key = readFileSync(options.keyFile ?? '/run/secrets/openai_api_key', 'utf8').trim();
      } catch {
        // Missing or unreadable credentials use the same authentication error.
      }
    }
    if (!key) {
      throw new ProviderError('authentication', 'Set OPENAI_API_KEY in .env before enabling API inference.');
    }
    return key;
  }
}
