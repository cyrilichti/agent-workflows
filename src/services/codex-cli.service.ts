import { PROJECT_ROOT } from '../config/keys.ts';
import { ProviderError } from '../errors/provider.error.ts';
import type { TaskResultEntity } from '../entities/task-result.entity.ts';
import type { AiProvider } from '../types/task.types.ts';
import type { CodexProviderOptions, CodexRunContext } from '../types/provider.types.ts';
import { CodexProcessService } from './codex-process.service.ts';

export class CodexCliService implements AiProvider {
  private readonly processes = new CodexProcessService();
  private readonly options: CodexProviderOptions;

  constructor(options: CodexProviderOptions) {
    this.options = options;
  }

  generate(prompt: string, options: Parameters<AiProvider['generate']>[1]): Promise<TaskResultEntity> {
    if (options.signal.aborted) {
      throw new ProviderError('timeout', 'Execution cancelled before launch.');
    }
    const context: CodexRunContext = {
      prompt,
      directory: options.directory ?? this.options.directory ?? PROJECT_ROOT,
      traceId: options.traceId,
      phase: options.phase,
      requestId: options.requestId,
    };
    return this.processes.execute(context, options.signal, this.options);
  }
}
