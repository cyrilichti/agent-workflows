import { ProviderError } from '../errors/provider.error.ts';
import type { TaskEntity } from '../entities/task.entity.ts';
import type { TaskResult } from '../types/task.types.ts';

export class TaskOutcomeService {
  complete(outcome: TaskEntity, result: TaskResult): void {
    outcome.status = 'completed';
    outcome.text = result.text;
    outcome.model = result.model;
    outcome.usage = result.usage;
    outcome.codexSummary = result.codexSummary;
    outcome.providerRequestId = result.requestId;
  }

  fail(outcome: TaskEntity, caught: unknown): void {
    const error = caught instanceof ProviderError ? caught : null;
    outcome.codexSummary = error?.codexSummary;
    const usage = error?.codexSummary?.usage;
    if (usage && Number.isFinite(usage.input_tokens) && Number.isFinite(usage.output_tokens)) {
      outcome.usage = {
        input: usage.input_tokens,
        output: usage.output_tokens,
        ...(Number.isFinite(usage.cached_input_tokens) ? { cachedInput: usage.cached_input_tokens } : {}),
      };
    }
    outcome.status = error?.code === 'timeout' || error?.code === 'network' ? 'unknown' : 'failed';
    outcome.error = {
      code: error?.code ?? 'provider_error',
      message: error?.message ?? 'Provider failed; no automatic retry.',
    };
  }

  finish(outcome: TaskEntity): void {
    outcome.endedAt = new Date().toISOString();
    outcome.durationMs = Date.parse(outcome.endedAt) - Date.parse(outcome.startedAt);
  }
}
