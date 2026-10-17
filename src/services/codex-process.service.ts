import { spawn } from 'node:child_process';
import { CodexCommandBuilder } from '../builders/codex-command.builder.ts';
import { ProviderError } from '../errors/provider.error.ts';
import type { TaskResultEntity } from '../entities/task-result.entity.ts';
import type { CodexProviderOptions, CodexRunContext, CodexRunState } from '../types/provider.types.ts';
import { CodexCompletionService } from './codex-completion.service.ts';
import { CodexOutputCaptureService } from './codex-output-capture.service.ts';
import { ProcessGroupService } from '../core/services/process-group.service.ts';

export class CodexProcessService {
  private readonly commands = new CodexCommandBuilder();
  private readonly capture = new CodexOutputCaptureService();
  private readonly completion = new CodexCompletionService();
  private readonly termination = new ProcessGroupService();

  execute(context: CodexRunContext, signal: AbortSignal, options: CodexProviderOptions): Promise<TaskResultEntity> {
    const spawnImpl = options.spawnImpl ?? spawn;
    const child = spawnImpl(options.executable ?? 'codex', this.commands.build(options, context.directory), {
      cwd: context.directory, detached: true, stdio: ['pipe', 'pipe', 'ignore'],
      env: { ...(options.environment ?? process.env) },
    });
    const state: CodexRunState = { output: '', pendingLine: '', itemCompletedAt: [] };
    return new Promise((resolve, reject) => {
      const abort = () => {
        state.failure = new ProviderError(
          'timeout',
          'Execution cancelled; remote outcome may be unknown. Inspect its effects before starting another request.',
        );
        this.termination.terminate(child);
      };
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
      child.stdout!.setEncoding('utf8');
      child.stdout!.on('data', (chunk) => this.capture.append(child, state, chunk));
      child.stdin!.on('error', () => {});
      child.on('error', () => { state.failure = new ProviderError('codex_start', 'Codex could not start.'); });
      child.on('close', (code) => {
        signal.removeEventListener('abort', abort);
        if (state.pendingLine.trim()) this.capture.recordItemCompletion(state, state.pendingLine);
        try {
          resolve(this.completion.complete(context, state, options.model ?? 'configured-default', code));
        } catch (error) {
          reject(error);
        }
      });
      child.stdin!.end(context.prompt);
    });
  }
}
