import type { TaskEntity } from '../entities/task.entity.ts';

export type CodexEventItem = {
  type?: string | undefined; id?: string; completedAt?: string; commandName?: string;
  exitCode?: number; tool?: string; inputCharacters: number; outputCharacters: number;
};

export type CodexSummary = {
  schemaVersion: number; traceId?: string | undefined; phase: string | null; requestId: string | null;
  threadId: string | null; model: string; promptCharacters: number; jsonlBytes: number;
  usage: { input_tokens: number; output_tokens: number; cached_input_tokens?: number } | null;
  eventCounts: Record<string, number>; malformedLines: number; items: CodexEventItem[];
  measurementNote: string;
};

export type TraceClient = { send(record: TaskEntity): Promise<void> };

export type TraceDeliveryFailure = 'network' | 'timeout' | 'http' | 'invalid_response' | 'partial_rejection';

export type TraceServiceOptions = {
  url: string; publicKey: string; secretKey: string; environment?: string | undefined; fetchImpl?: typeof fetch;
};

export type CodexSummaryOptions = {
  traceId?: string | undefined; phase?: string | undefined; requestId?: string | undefined; model: string;
  prompt: string; itemCompletedAt?: string[];
};

export type TraceBuildOptions = { environment?: string | undefined };

export type TraceAttribute = {
  key: string;
  value: { stringValue?: string; arrayValue?: { values: { stringValue: string }[] } };
};

export type TraceSpan = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  status: { code: number; message?: string };
  attributes: TraceAttribute[];
};

export type TraceBatch = {
  resourceSpans: {
    resource: { attributes: TraceAttribute[] };
    scopeSpans: { scope: { name: string; version: string }; spans: TraceSpan[] }[];
  }[];
};

export type CodexRawEvent = {
  type: string;
  thread_id?: string;
  usage?: { input_tokens: number; cached_input_tokens?: number; output_tokens: number };
  item?: {
    type?: string; id?: string; text?: string; command?: string; exit_code?: number;
    server?: string; tool?: string; arguments?: unknown; input?: unknown;
    result?: unknown; aggregated_output?: unknown; output?: unknown;
  };
};
