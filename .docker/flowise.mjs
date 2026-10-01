import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export async function connectFlowise(root, { install = false, fetchImpl = fetch } = {}) {
  const path = join(root, '.local/flowise-account.json');
  if (!existsSync(path)) {
    if (!install) throw new Error('Run npm run start first.');
    writeFileSync(path, JSON.stringify({ email: 'local@example.test', password: randomBytes(24).toString('base64url') }), { mode: 0o600 });
  }
  const account = JSON.parse(readFileSync(path, 'utf8'));
  const cookies = new Map();
  async function request(path, body) {
    const response = await fetchImpl('http://localhost:3000/api/v1' + path, {
      method: body === undefined ? 'GET' : 'POST', signal: AbortSignal.timeout(120000),
      headers: { 'Content-Type': 'application/json', 'x-request-from': 'internal', Cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; ') },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0], split = pair.indexOf('=');
      cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    if (!response.ok) throw Object.assign(new Error(`Flowise returned HTTP ${response.status}. Check npm run logs.`), { status: response.status });
    return response.json();
  }
  try { await request('/auth/login', account); }
  catch (error) {
    if (!install || ![400, 401, 404].includes(error.status)) throw error;
    await request('/account/register', { user: { name: 'Local user', email: account.email, credential: account.password } });
    await request('/auth/login', account);
  }
  return { request, account };
}
export async function installFlowise(root, options) {
  const { request, account } = await connectFlowise(root, { ...options, install: true });
  const idPath = join(root, '.local/flowise-id');
  if (existsSync(idPath)) {
    const id = readFileSync(idPath, 'utf8').trim();
    await request('/chatflows/' + id);
    return { id, account };
  }
  const flow = await request('/chatflows', { name: 'Local AI — Codex or API', type: 'AGENTFLOW',
    flowData: readFileSync(join(root, '.docker/workflow.json'), 'utf8'), deployed: true, isPublic: false });
  writeFileSync(idPath, flow.id, { mode: 0o600 });
  return { id: flow.id, account };
}
