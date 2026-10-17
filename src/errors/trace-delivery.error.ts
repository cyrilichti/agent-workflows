import type { TraceDeliveryFailure } from '../types/trace.types.ts';

export class TraceDeliveryError extends Error {
  readonly reason: TraceDeliveryFailure;
  readonly status: number | undefined;

  constructor(reason: TraceDeliveryFailure, status?: number) {
    super(`Trace delivery failed: ${reason}${status === undefined ? '' : ` (HTTP ${status})`}.`);
    this.reason = reason;
    this.status = status;
  }
}
