import type { TaskOutcome } from '../types/task.types.ts';

export class TaskEntity {
  requestId: TaskOutcome['requestId'];
  prompt: TaskOutcome['prompt'];
  directory?: TaskOutcome['directory'];
  provider: TaskOutcome['provider'];
  model: TaskOutcome['model'];
  status: TaskOutcome['status'];
  traceId: TaskOutcome['traceId'];
  startedAt: TaskOutcome['startedAt'];
  trace?: TaskOutcome['trace'];
  traceStatus?: TaskOutcome['traceStatus'];
  endedAt?: TaskOutcome['endedAt'];
  durationMs?: TaskOutcome['durationMs'];
  text?: TaskOutcome['text'];
  error?: TaskOutcome['error'];
  usage?: TaskOutcome['usage'];
  codexSummary?: TaskOutcome['codexSummary'];
  providerRequestId?: TaskOutcome['providerRequestId'];

  constructor(value: TaskOutcome) {
    this.requestId = value.requestId;
    this.prompt = value.prompt;
    this.directory = value.directory;
    this.provider = value.provider;
    this.model = value.model;
    this.status = value.status;
    this.traceId = value.traceId;
    this.startedAt = value.startedAt;
    this.trace = value.trace;
  }
}
