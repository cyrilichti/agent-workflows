import { TaskResponseEntity } from '../entities/task-response.entity.ts';
import type { TaskEntity } from '../entities/task.entity.ts';

export class TaskResponseBuilder {
  build(outcome: TaskEntity, publicUrl: string, projectId: string): TaskResponseEntity {
    return new TaskResponseEntity({
      requestId: outcome.requestId, provider: outcome.provider, model: outcome.model,
      status: outcome.status, text: outcome.text ?? null, error: outcome.error ?? null,
      usage: outcome.usage ?? null, durationMs: outcome.durationMs ?? null,
      providerRequestId: outcome.providerRequestId ?? null, traceId: outcome.traceId,
      traceStatus: outcome.traceStatus,
      traceUrl: `${publicUrl}/project/${projectId}/traces/${outcome.traceId}`,
    });
  }
}
