import type { CodexEventItem } from '../types/trace.types.ts';

export class TraceItemEntity {
  readonly event: CodexEventItem;
  readonly index: number;
  readonly commandIndex: number;

  constructor(
    event: CodexEventItem,
    index: number,
    commandIndex: number,
  ) {
    this.event = event;
    this.index = index;
    this.commandIndex = commandIndex;
  }
}
