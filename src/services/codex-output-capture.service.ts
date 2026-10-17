import type { ChildProcess } from 'node:child_process';
import { ProviderError } from '../errors/provider.error.ts';
import { MAX_CODEX_OUTPUT_BYTES } from '../config/keys.ts';
import type { CodexRunState } from '../types/provider.types.ts';
import { CodexEventService } from './codex-event.service.ts';
import { ProcessGroupService } from '../core/services/process-group.service.ts';

export class CodexOutputCaptureService {
  private readonly events = new CodexEventService();
  private readonly termination = new ProcessGroupService();

  append(child: ChildProcess, state: CodexRunState, chunk: string): void {
    state.output += chunk;
    state.pendingLine += chunk;
    let newline = state.pendingLine.indexOf('\n');
    while (newline !== -1) {
      this.recordItemCompletion(state, state.pendingLine.slice(0, newline));
      state.pendingLine = state.pendingLine.slice(newline + 1);
      newline = state.pendingLine.indexOf('\n');
    }
    if (Buffer.byteLength(state.output) > MAX_CODEX_OUTPUT_BYTES) {
      state.failure = new ProviderError('output_limit', 'Codex output exceeded the local limit.');
      this.termination.terminate(child);
    }
  }

  recordItemCompletion(state: CodexRunState, line: string): void {
    if (this.events.isItemCompletion(line)) state.itemCompletedAt.push(new Date().toISOString());
  }
}
