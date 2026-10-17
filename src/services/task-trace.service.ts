import type { TaskEntity } from '../entities/task.entity.ts';
import { TraceDeliveryError } from '../errors/trace-delivery.error.ts';

export class TaskTraceService {
  private readonly send: (outcome: TaskEntity) => Promise<void>;

  constructor(send: (outcome: TaskEntity) => Promise<void>) {
    this.send = send;
  }

  async record(outcome: TaskEntity): Promise<void> {
    try {
      await this.send(outcome);
      outcome.traceStatus = 'accepted';
    } catch (error) {
      outcome.traceStatus = 'failed';
      console.error('Trace delivery failed', {
        traceId: outcome.traceId,
        reason: error instanceof TraceDeliveryError ? error.reason : 'unexpected_error',
        ...(error instanceof TraceDeliveryError && error.status !== undefined ? { status: error.status } : {}),
      });
    }
  }
}
