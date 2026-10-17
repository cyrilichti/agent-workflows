import type { TaskInput } from '../types/task.types.ts';

export class TaskInputEntity {
  readonly requestId: string;
  readonly prompt: string;
  readonly directory: string | undefined;
  readonly timeoutMs: number | undefined;
  readonly trace?: TaskInput['trace'];

  constructor(value: TaskInput) {
    this.requestId = value.requestId;
    this.prompt = value.prompt;
    this.directory = value.directory;
    this.timeoutMs = value.timeoutMs;
    this.trace = value.trace ? {
      name: value.trace.name,
      observationName: value.trace.observationName,
      tags: [...value.trace.tags],
      ...(value.trace.sessionId !== undefined ? { sessionId: value.trace.sessionId } : {}),
      ...(value.trace.level !== undefined ? { level: value.trace.level } : {}),
    } : undefined;
  }
}
