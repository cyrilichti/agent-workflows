import type { TaskResponse } from '../types/task.types.ts';

export class TaskResponseEntity {
  readonly requestId: TaskResponse['requestId'];
  readonly provider: TaskResponse['provider'];
  readonly model: TaskResponse['model'];
  readonly status: TaskResponse['status'];
  readonly text: TaskResponse['text'];
  readonly error: TaskResponse['error'];
  readonly usage: TaskResponse['usage'];
  readonly durationMs: TaskResponse['durationMs'];
  readonly providerRequestId: TaskResponse['providerRequestId'];
  readonly traceId: TaskResponse['traceId'];
  readonly traceStatus: TaskResponse['traceStatus'];
  readonly traceUrl: TaskResponse['traceUrl'];

  constructor(value: TaskResponse) {
    this.requestId = value.requestId;
    this.provider = value.provider;
    this.model = value.model;
    this.status = value.status;
    this.text = value.text;
    this.error = value.error;
    this.usage = value.usage;
    this.durationMs = value.durationMs;
    this.providerRequestId = value.providerRequestId;
    this.traceId = value.traceId;
    this.traceStatus = value.traceStatus;
    this.traceUrl = value.traceUrl;
  }
}
