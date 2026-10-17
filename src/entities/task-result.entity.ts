import type { TaskResult } from '../types/task.types.ts';

export class TaskResultEntity {
  readonly text: TaskResult['text'];
  readonly model: TaskResult['model'];
  readonly requestId?: TaskResult['requestId'];
  readonly usage?: TaskResult['usage'];
  codexSummary?: TaskResult['codexSummary'];

  constructor(value: TaskResult) {
    this.text = value.text;
    this.model = value.model;
    this.requestId = value.requestId;
    this.usage = value.usage;
    this.codexSummary = value.codexSummary;
  }
}
