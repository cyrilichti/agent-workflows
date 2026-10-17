import type { AiProvider } from './task.types.ts';
import type { TaskEntity } from '../entities/task.entity.ts';

export type TaskServiceOptions = {
  provider: AiProvider;
  providerName: string;
  model: string;
  trace: (outcome: TaskEntity) => Promise<void>;
  publicUrl: string;
  projectId: string;
  enabled: boolean;
  timeoutMs?: number;
};

export type TaskExecutionOptions = Pick<
  TaskServiceOptions,
  'provider' | 'providerName' | 'model' | 'enabled' | 'timeoutMs'
>;
