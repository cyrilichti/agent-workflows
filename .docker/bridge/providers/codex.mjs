import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { ProviderError } from '../contract.mjs';

// Pinned CLI schema: https://github.com/openai/codex/blob/rust-v0.159.2/codex-rs/core/config.schema.json
const disabled = ['shell_tool', 'unified_exec', 'apply_patch_freeform', 'js_repl', 'code_mode',
  'code_mode_host', 'code_mode_only', 'apps', 'plugins', 'hooks',
  'plugin_hooks', 'multi_agent', 'multi_agent_v2', 'multi_agent_mode', 'browser_use',
  'computer_use', 'in_app_browser', 'image_generation', 'view_image',
  'memories', 'skill_search', 'tool_search', 'search_tool', 'remote_plugin',
  'request_permissions_tool', 'tool_suggest', 'goals', 'sleep_tool', 'unified_exec_tty',
  'unified_exec_zsh_fork', 'shell_snapshot', 'in_app_local_automation', 'in_app_chat',
  'workspace_dependencies', 'skill_mcp_dependency_install', 'unbounded_connection_retries'];
export function codexArgs(model, workspace) {
  const args = ['exec', '--json', '--ephemeral', '--skip-git-repo-check', '--ignore-user-config',
    '--sandbox', 'read-only', '-C', '/empty', '-m', model,
    '-c', 'approval_policy="never"', '-c', 'forced_login_method="chatgpt"',
    '-c', 'web_search="disabled"', '-c', 'model_provider="openai"',
    '-c', 'model_reasoning_effort="low"', '-c', 'cli_auth_credentials_store="file"'];
  if (workspace) args.push('-c', `forced_chatgpt_workspace_id=${JSON.stringify(workspace)}`);
  for (const feature of disabled) args.push('--disable', feature);
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
export function createCodex({ model, workspace = '', authDir = '/auth', spawnImpl = spawn }) {
  return {
    async generate(prompt, { signal }) {
      let auth;
      try { auth = JSON.parse(readFileSync(`${authDir}/auth.json`, 'utf8')); }
      catch { throw new ProviderError('authentication', 'Sign in to Codex with ChatGPT first.'); }
      if (!auth.tokens?.access_token || auth.OPENAI_API_KEY || (workspace && auth.tokens.account_id !== workspace))
        throw new ProviderError('authentication', 'A ChatGPT login in the configured workspace is required.');
      return new Promise((resolve, reject) => {
        const child = spawnImpl('codex', codexArgs(model, workspace), {
          detached: true, stdio: ['pipe', 'pipe', 'ignore'],
          env: { PATH: process.env.PATH, HOME: '/tmp', CODEX_HOME: authDir, LANG: 'C.UTF-8' }
        });
        let output = '', failure;
        const kill = () => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} };
        const abort = () => { failure = new ProviderError('timeout', 'Execution cancelled; remote outcome may be unknown. Reuse this request ID.'); kill(); };
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
        child.stdout.on('data', chunk => {
          output += chunk;
          if (Buffer.byteLength(output) > 2 * 1024 * 1024) {
            failure = new ProviderError('output_limit', 'Codex output exceeded the local limit.'); kill();
          }
        });
        child.stdin.on('error', () => {});
        child.on('error', () => { failure = new ProviderError('codex_start', 'Codex could not start.'); });
        child.on('close', code => {
          signal.removeEventListener('abort', abort);
          if (failure) return reject(failure);
          if (code !== 0) return reject(new ProviderError('codex_error', 'Codex exited without success. Check login, quota and model access.'));
          try { resolve(parseCodex(output, model)); } catch (error) { reject(error); }
        });
        child.stdin.end(prompt);
      });
    }
  };
}
