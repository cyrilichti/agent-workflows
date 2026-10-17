import { spawn } from 'node:child_process';
import { ProviderError } from '../execution/task-contract.mjs';
import { PROJECT_ROOT } from '../project-root.mjs';
import { summarizeCodexEvents } from '../observability/codex-usage-report.mjs';

// Authentication, tools, skills, MCP servers and model defaults belong to the local CLI.
/**
 * Build an ephemeral, non-interactive invocation that retains local CLI settings.
 *
 * @param {string | undefined} model Optional override of the configured model.
 * @param {string} workspace Optional ChatGPT workspace restriction.
 * @param {string} [directory=PROJECT_ROOT] Working directory for the task.
 * @returns {string[]} Arguments passed directly to spawn, without a shell.
 */
export function buildCodexArguments(model, workspace, directory = PROJECT_ROOT) {
  const args = [
    'exec',
    '--json',
    '--ephemeral',
    '--skip-git-repo-check',
    '-C',
    directory,
    '-c',
    'approval_policy="never"',
  ];
  if (model) {
    args.push('-m', model);
  }
  if (workspace) {
    args.push('-c', `forced_chatgpt_workspace_id=${JSON.stringify(workspace)}`);
  }
  return [...args, '-'];
}

/**
 * Read the final agent response and usage from a completed JSONL event stream.
 *
 * @param {string} text Captured CLI standard output.
 * @param {string} model Model label to include in the result.
 * @returns {import('../execution/task-contract.mjs').TaskResult}
 * @throws {ProviderError} For malformed events, failed turns or missing completion.
 */
export function parseCodexEvents(text, model) {
  let output = '';
  let requestId;
  let usage;
  let completed = false;
  for (const line of text.split('\n').filter(Boolean)) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      throw new ProviderError('invalid_output', 'Invalid Codex event stream.');
    }
    if (event.type === 'thread.started') {
      requestId = event.thread_id;
    }
    if (event.type === 'item.completed' && event.item?.type === 'agent_message') {
      output = event.item.text;
    }
    if (event.type === 'turn.failed') {
      throw new ProviderError(
        'codex_error',
        'Codex failed. Check authentication, model access and quota. No fallback was attempted.',
      );
    }
    if (event.type === 'turn.completed') {
      completed = true;
      const providerUsage = event.usage;
      if (providerUsage) {
        usage = {
          input: providerUsage.input_tokens,
          cachedInput: providerUsage.cached_input_tokens,
          output: providerUsage.output_tokens,
        };
      }
    }
  }
  if (!completed || !output) {
    throw new ProviderError('invalid_output', 'Codex did not complete a text response.');
  }
  return { text: output, model, requestId, usage };
}

/**
 * Create a local CLI adapter; authentication remains owned by Codex.
 *
 * @param {object} options
 * @param {string} [options.model] Optional model override.
 * @param {string} [options.workspace=''] Optional ChatGPT workspace restriction.
 * @param {string} [options.executable='codex'] Executable name or absolute path.
 * @param {NodeJS.ProcessEnv} [options.environment=process.env] Inherited host environment.
 * @param {string} [options.directory=PROJECT_ROOT] Task working directory.
 * @param {typeof spawn} [options.spawnImpl=spawn] Injectable subprocess launcher.
 * @returns {import('../execution/task-contract.mjs').AiProvider}
 */
export function createCodexCliProvider({
  model,
  workspace = '',
  executable = 'codex',
  environment = process.env,
  directory = PROJECT_ROOT,
  spawnImpl = spawn,
}) {
  return {
    /**
     * Run one CLI process group and terminate it on cancellation or excess output.
     *
     * @param {string} prompt Task instructions.
     * @param {{ signal: AbortSignal, directory?: string, traceId?: string, phase?: string, requestId?: string }} options Cancellation and report identifiers.
     * @returns {Promise<import('../execution/task-contract.mjs').TaskResult>}
     * @throws {ProviderError} For execution, authentication, cancellation or provider failures.
     */
    async generate(prompt, { signal, directory: taskDirectory = directory, traceId, phase, requestId }) {
      if (signal.aborted) {
        throw new ProviderError('timeout', 'Execution cancelled before launch.');
      }
      return new Promise((resolve, reject) => {
        const child = spawnImpl(executable, buildCodexArguments(model, workspace, taskDirectory), {
          cwd: taskDirectory,
          detached: true,
          stdio: ['pipe', 'pipe', 'ignore'],
          env: { ...environment },
        });
        let output = '';
        let pendingLine = '';
        const itemCompletedAt = [];
        let failure;
        const captureItemCompletion = (line) => {
          try {
            const event = JSON.parse(line);
            if (event.type === 'item.completed' && event.item) {
              itemCompletedAt.push(new Date().toISOString());
            }
          } catch {
            // The summary records malformed lines after the process exits.
          }
        };
        /** Terminate the detached process group, including tools started by Codex. */
        const terminateProcessGroup = () => {
          try {
            process.kill(-child.pid, 'SIGKILL');
          } catch {
            // The process may already have exited or failed to spawn.
          }
        };
        /** Record cancellation before terminating the subprocess. */
        const abort = () => {
          failure = new ProviderError(
            'timeout',
            'Execution cancelled; remote outcome may be unknown. Inspect its effects before starting another request.',
          );
          terminateProcessGroup();
        };
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) {
          abort();
        }
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk) => {
          output += chunk;
          pendingLine += chunk;
          let newline = pendingLine.indexOf('\n');
          while (newline !== -1) {
            captureItemCompletion(pendingLine.slice(0, newline));
            pendingLine = pendingLine.slice(newline + 1);
            newline = pendingLine.indexOf('\n');
          }
          if (Buffer.byteLength(output) > 32 * 1024 * 1024) {
            failure = new ProviderError('output_limit', 'Codex output exceeded the local limit.');
            terminateProcessGroup();
          }
        });
        child.stdin.on('error', () => {
          // Early exit can close stdin; process events determine the final outcome.
        });
        child.on('error', () => {
          failure = new ProviderError('codex_start', 'Codex could not start.');
        });
        child.on('close', (code) => {
          signal.removeEventListener('abort', abort);
          if (pendingLine.trim()) captureItemCompletion(pendingLine);
          const codexSummary = output ? summarizeCodexEvents(output, {
            traceId,
            phase,
            requestId,
            model: model || 'configured-default',
            prompt,
            itemCompletedAt,
          }) : undefined;
          if (failure) {
            failure.codexSummary = codexSummary;
            return reject(failure);
          }
          if (code !== 0) {
            const error = new ProviderError(
              'codex_error',
              'Codex exited without success. Check login, quota and model access.',
            );
            error.codexSummary = codexSummary;
            return reject(error);
          }
          try {
            const result = parseCodexEvents(output, model || 'configured-default');
            result.codexSummary = codexSummary;
            resolve(result);
          } catch (error) {
            error.codexSummary = codexSummary;
            reject(error);
          }
        });
        child.stdin.end(prompt);
      });
    },
  };
}
