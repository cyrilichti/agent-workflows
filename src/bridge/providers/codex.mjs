import { spawn } from 'node:child_process';
import { ProviderError } from '../contract.mjs';

// Authentication, tools, skills, MCP servers and model defaults belong to the local CLI.
export function codexArgs(model, workspace, directory = process.cwd()) {
  const args = ['exec', '--json', '--ephemeral', '--skip-git-repo-check',
    '-C', directory, '-c', 'approval_policy="never"'];
  if (model) args.push('-m', model);
  if (workspace) args.push('-c', `forced_chatgpt_workspace_id=${JSON.stringify(workspace)}`);
  return [...args, '-'];
}
export function parseCodex(text, model) {
  let output = '', requestId, usage, completed = false;
  for (const line of text.split('\n').filter(Boolean)) {
    let event;
    try { event = JSON.parse(line); } catch { throw new ProviderError('invalid_output', 'Invalid Codex event stream.'); }
    if (event.type === 'thread.started') requestId = event.thread_id;
    if (event.type === 'item.completed' && event.item?.type === 'agent_message') output = event.item.text;
    if (event.type === 'turn.failed')
      throw new ProviderError('codex_error', 'Codex failed. Check authentication, model access and quota. No fallback was attempted.');
    if (event.type === 'turn.completed') {
      completed = true;
      const u = event.usage;
      if (u) usage = { input: u.input_tokens, cachedInput: u.cached_input_tokens, output: u.output_tokens };
    }
  }
  if (!completed || !output) throw new ProviderError('invalid_output', 'Codex did not complete a text response.');
  return { text: output, model, requestId, usage };
}
export function createCodex({ model, workspace = '', executable = 'codex', environment = process.env, directory = process.cwd(), spawnImpl = spawn }) {
  return {
    async generate(prompt, { signal }) {
      if (signal.aborted) throw new ProviderError('timeout', 'Execution cancelled before launch.');
      return new Promise((resolve, reject) => {
        const child = spawnImpl(executable, codexArgs(model, workspace, directory), {
          cwd: directory, detached: true, stdio: ['pipe', 'pipe', 'ignore'],
          env: { ...environment }
        });
        let output = '', failure;
        const kill = () => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} };
        const abort = () => { failure = new ProviderError('timeout', 'Execution cancelled; remote outcome may be unknown. Reuse this request ID.'); kill(); };
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
        child.stdout.on('data', chunk => {
          output += chunk;
          if (Buffer.byteLength(output) > 32 * 1024 * 1024) {
            failure = new ProviderError('output_limit', 'Codex output exceeded the local limit.'); kill();
          }
        });
        child.stdin.on('error', () => {});
        child.on('error', () => { failure = new ProviderError('codex_start', 'Codex could not start.'); });
        child.on('close', code => {
          signal.removeEventListener('abort', abort);
          if (failure) return reject(failure);
          if (code !== 0) return reject(new ProviderError('codex_error', 'Codex exited without success. Check login, quota and model access.'));
          try { resolve(parseCodex(output, model || 'configured-default')); } catch (error) { reject(error); }
        });
        child.stdin.end(prompt);
      });
    }
  };
}
