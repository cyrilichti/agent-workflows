import { ProviderError } from '../errors/provider.error.ts';
import type { TaskResultEntity } from '../entities/task-result.entity.ts';
import type { CodexRunContext, CodexRunState } from '../types/provider.types.ts';
import { CodexEventService } from './codex-event.service.ts';

export class CodexCompletionService {
  private readonly events = new CodexEventService();

  complete(context: CodexRunContext, state: CodexRunState, model: string, code: number | null): TaskResultEntity {
    const summary = state.output ? this.events.summarize(state.output, {
      traceId: context.traceId, phase: context.phase, requestId: context.requestId,
      model, prompt: context.prompt, itemCompletedAt: state.itemCompletedAt,
    }) : undefined;
    if (state.failure) {
      state.failure.codexSummary = summary;
      throw state.failure;
    }
    if (code !== 0) {
      const error = new ProviderError('codex_error', 'Codex exited without success. Check login, quota and model access.');
      error.codexSummary = summary;
      throw error;
    }
    try {
      const result = this.events.parseTurnResult(state.output, model);
      result.codexSummary = summary;
      return result;
    } catch (error) {
      if (error instanceof ProviderError) error.codexSummary = summary;
      throw error;
    }
  }
}
