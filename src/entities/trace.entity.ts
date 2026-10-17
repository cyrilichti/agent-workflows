import type { TraceBatch } from '../types/trace.types.ts';

export class TraceEntity {
  readonly resourceSpans: TraceBatch['resourceSpans'];

  constructor(batch: TraceBatch) {
    this.resourceSpans = batch.resourceSpans;
  }
}
