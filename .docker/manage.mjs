import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { prepare, writeConfig } from './config.mjs';
import { installFlowise } from './flowise.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const action = process.argv[2];
const denyList = JSON.parse(readFileSync(join(root, '.docker/flowise-deny.json'), 'utf8'));
function compose(args, { input, capture = false, allowFailure = false } = {}) {
  // The root .env is authoritative even when the shell defines Compose/provider variables.
  const config = prepare(root, denyList);
  const result = spawnSync('docker', ['compose', '--env-file', '.env', ...args], {
    cwd: root, env: { ...process.env, ...config, COMPOSE_FILE: join(root, 'compose.yaml'), COMPOSE_PROJECT_NAME: 'agent-workflows-ai' },
    encoding: 'utf8', input, stdio: capture ? ['pipe', 'pipe', 'pipe'] : input === undefined ? 'inherit' : ['pipe', 'inherit', 'inherit']
  });
  if (result.error) throw new Error('Docker is unavailable. Start Docker and run npm run start again.');
  if (result.status !== 0 && !allowFailure) throw new Error('Docker command failed. Check the output above or npm run logs.');
  return result;
}
const authProbe = `try { const a=JSON.parse(require('fs').readFileSync('/auth/auth.json')); if(!a.tokens?.access_token||a.OPENAI_API_KEY||!a.tokens.account_id)process.exit(1); console.log(a.tokens.account_id); } catch { process.exit(1); }`;
function bindWorkspace(config, workspace) {
  if (config.CODEX_WORKSPACE_ID && config.CODEX_WORKSPACE_ID !== workspace) throw new Error('Codex login differs from CODEX_WORKSPACE_ID in .env. Verify the intended workspace.');
  if (config.CODEX_WORKSPACE_ID !== workspace) {
    config.CODEX_WORKSPACE_ID = workspace; writeConfig(root, config);
    compose(['up', '-d', '--wait', 'bridge']);
  }
}
function authenticate(config, interactive = false) {
  const probe = compose(['exec', '-T', 'bridge', 'node', '-e', authProbe], { capture: true, allowFailure: true });
  if (probe.status === 0 && !interactive) { bindWorkspace(config, probe.stdout.trim()); return true; }
  const authPath = join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'auth.json');
  let auth;
  try { auth = JSON.parse(readFileSync(authPath, 'utf8')); } catch {}
  if (auth?.tokens?.access_token && auth.tokens.account_id && !auth.OPENAI_API_KEY) {
    if (config.CODEX_WORKSPACE_ID && config.CODEX_WORKSPACE_ID !== auth.tokens.account_id) throw new Error('Host Codex login differs from CODEX_WORKSPACE_ID in .env.');
    const payload = Object.fromEntries(['auth_mode', 'tokens', 'last_refresh'].filter(k => k in auth).map(k => [k, auth[k]]));
    compose(['exec', '-T', 'bridge', 'node', '-e', "let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>require('fs').writeFileSync('/auth/auth.json',s,{mode:0o600}));"], { input: JSON.stringify(payload) });
    bindWorkspace(config, auth.tokens.account_id);
    return true;
  }
  if (!interactive) return false;
  compose(['exec', 'bridge', 'codex', '-c', 'cli_auth_credentials_store="file"', 'login', '--device-auth']);
  const signedIn = compose(['exec', '-T', 'bridge', 'node', '-e', authProbe], { capture: true });
  bindWorkspace(config, signedIn.stdout.trim());
  return true;
}
try {
  if (!['up', 'stop', 'logs', 'login'].includes(action)) throw new Error('Use npm run start, stop, login or logs.');
  const config = prepare(root, denyList);
  if (action === 'stop') {
    // Stop both profiles so a previous provider cannot keep running after an .env change.
    compose(['--profile', 'codex', '--profile', 'openai-api', 'stop']);
  } else if (action === 'logs') {
    compose(['--profile', 'codex', '--profile', 'openai-api', 'logs', '--tail', '80', 'bridge', 'bridge-api', 'flowise', 'langfuse-web', 'langfuse-worker']);
  } else {
    if (action === 'login' && config.COMPOSE_PROFILES !== 'codex') throw new Error('npm run login is for COMPOSE_PROFILES=codex. Configure OPENAI_API_KEY for API mode.');
    if (config.COMPOSE_PROFILES === 'openai-api' && config.INFERENCE_ENABLED === 'true' && !config.OPENAI_API_KEY) throw new Error('Set OPENAI_API_KEY in .env before enabling API inference.');
    const inactive = config.COMPOSE_PROFILES === 'codex' ? 'bridge-api' : 'bridge';
    compose(['--profile', 'codex', '--profile', 'openai-api', 'stop', inactive]);
    compose(['up', '-d', '--build', '--wait', '--wait-timeout', '180']);
    if (config.COMPOSE_PROFILES === 'codex') {
      if (!authenticate(config, action === 'login')) console.log('Codex needs a login: run npm run login, then follow the browser instructions.');
    }
    const flow = await installFlowise(root);
    writeFileSync(join(root, '.local/access.json'), JSON.stringify({
      flowise: { url: 'http://localhost:3000', ...flow.account },
      langfuse: { url: 'http://localhost:3001', email: 'local@example.test', password: config.LANGFUSE_ADMIN_PASSWORD }
    }, null, 2) + '\n', { mode: 0o600 });
    console.log('\nReady: Flowise http://localhost:3000 · Langfuse http://localhost:3001');
    console.log('Logins: .local/access.json · Workflow: Local AI — Codex or API');
    if (config.INFERENCE_ENABLED !== 'true') console.log('Inference is disabled. Verify your allowance/budget, set INFERENCE_ENABLED=true in .env, then npm run start.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
