import type { TaskEntity } from '../entities/task.entity.ts';

export class TaskTraceService {
  private readonly send: (outcome: TaskEntity) => Promise<void>;

  constructor(send: (outcome: TaskEntity) => Promise<void>) {
    this.send = send;
  }

  async record(outcome: TaskEntity): Promise<void> {
    try {
      await this.send(outcome);
      outcome.traceStatus = 'accepted';
    } catch {
      outcome.traceStatus = 'failed';
    }
  }
}
