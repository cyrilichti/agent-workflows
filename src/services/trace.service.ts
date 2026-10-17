import { TraceBuilder } from '../builders/trace.builder.ts';
import { TRACE_REQUEST_TIMEOUT_MS } from '../config/keys.ts';
import { TraceDeliveryError } from '../errors/trace-delivery.error.ts';
import { isRecord } from '../helper.ts';
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
    const signal = AbortSignal.timeout(TRACE_REQUEST_TIMEOUT_MS);
    const body = JSON.stringify(this.builder.build(record, { environment }));
    let response: Response;
    try {
      response = await fetchImpl(`${url}/api/public/otel/v1/traces`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'x-langfuse-ingestion-version': '4',
          Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString('base64')}`,
        },
        body,
      });
    } catch {
      throw new TraceDeliveryError(signal.aborted ? 'timeout' : 'network');
    }
    if (!response.ok) throw new TraceDeliveryError('http', response.status);
    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw new TraceDeliveryError('invalid_response');
    }
    if (!isRecord(result) || (result.partialSuccess !== undefined && !isRecord(result.partialSuccess))) {
      throw new TraceDeliveryError('invalid_response');
    }
    const partial = result.partialSuccess;
    if (isRecord(partial) && (Number(partial.rejectedSpans ?? 0) > 0 || partial.errorMessage)) {
      throw new TraceDeliveryError('partial_rejection');
    }
  }
}
