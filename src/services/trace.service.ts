import { TraceBuilder } from '../builders/trace.builder.ts';
import { TRACE_REQUEST_TIMEOUT_MS } from '../config/keys.ts';
import type { TaskEntity } from '../entities/task.entity.ts';
import type { TraceClient, TraceServiceOptions } from '../types/trace.types.ts';

export class TraceService implements TraceClient {
  private readonly options: TraceServiceOptions;
  private readonly builder = new TraceBuilder();

  constructor(options: TraceServiceOptions) {
    this.options = options;
  }

  async send(record: TaskEntity): Promise<void> {
    const { url, publicKey, secretKey, environment, fetchImpl = fetch } = this.options;
    const response = await fetchImpl(`${url}/api/public/otel/v1/traces`, {
      method: 'POST',
      signal: AbortSignal.timeout(TRACE_REQUEST_TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        'x-langfuse-ingestion-version': '4',
        Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString('base64')}`,
      },
      body: JSON.stringify(this.builder.build(record, { environment })),
    });
    if (!response.ok) throw new Error('Trace delivery failed');
    const result = await response.json();
    if (Number(result.partialSuccess?.rejectedSpans ?? 0) > 0 || result.partialSuccess?.errorMessage) {
      throw new Error('Trace span was not fully accepted');
    }
  }
}
