import type { CodexSummary } from './trace.types.ts';
import type { TaskResultEntity } from '../entities/task-result.entity.ts';

export type TraceLabels = {
  name: string;
  observationName: string;
  tags: string[];
  level?: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
};

export type TaskInput = {
  requestId: string;
  prompt: string;
  directory?: string;
  timeoutMs?: number;
  trace?: TraceLabels;
};

export type TokenUsage = { input: number; output: number; cachedInput?: number | undefined };

export type TaskResult = {
  text: string;
  model: string;
  requestId?: string | undefined;
  usage?: TokenUsage | undefined;
  codexSummary?: CodexSummary | undefined;
};

export type AiProvider = {
  generate(prompt: string, options: {
    signal: AbortSignal; directory?: string | undefined; traceId?: string | undefined;
    phase?: string | undefined; requestId?: string | undefined;
  }): Promise<TaskResultEntity>;
};

export type TaskOutcome = {
  requestId: string;
  prompt: string;
  provider: string;
  model: string;
  status: 'running' | 'completed' | 'failed' | 'unknown';
  traceStatus?: 'accepted' | 'failed' | undefined;
  traceId: string;
  startedAt: string;
  endedAt?: string | undefined;
  durationMs?: number | undefined;
  text?: string | undefined;
  error?: { code: string; message: string } | undefined;
  usage?: TokenUsage | undefined;
  codexSummary?: CodexSummary | undefined;
  providerRequestId?: string | undefined;
  trace?: TraceLabels | undefined;
};

export type TaskResponse = {
  requestId: string; provider: string; model: string; status: TaskOutcome['status'];
  text: string | null; error: TaskOutcome['error'] | null;
  usage: TokenUsage | null; durationMs: number | null;
  providerRequestId: string | null; traceId: string;
  traceStatus: TaskOutcome['traceStatus']; traceUrl: string;
};
