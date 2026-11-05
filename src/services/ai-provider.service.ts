import { CodexCliService } from './codex-cli.service.ts';
import type { AiProvider } from '../types/task.types.ts';
import type { ProviderOptions } from '../types/provider.types.ts';

export class AiProviderService {
  create(name: string, options: ProviderOptions): AiProvider {
    if (name === 'codex') {
      return new CodexCliService(options);
    }
    throw new Error(`Unknown AI_PROVIDER: ${name}`);
  }
}
