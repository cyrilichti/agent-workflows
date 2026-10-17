import type { CodexSummary } from '../types/trace.types.ts';
export class ProviderError extends Error {
  codexSummary?: CodexSummary | undefined;
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}
