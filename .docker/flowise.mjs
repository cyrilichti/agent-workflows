import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export async function installFlowise({ url, email, password, workflow, idPath, fetchImpl = fetch }) {
  if (!email || !password) throw new Error('Set FLOWISE_ADMIN_EMAIL and FLOWISE_ADMIN_PASSWORD in .env.');
  const cookies = new Map();
  async function request(path, body) {
    const response = await fetchImpl(url + '/api/v1' + path, {
      method: body === undefined ? 'GET' : 'POST', signal: AbortSignal.timeout(120000),
      headers: { 'Content-Type': 'application/json', 'x-request-from': 'internal', Cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; ') },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0], split = pair.indexOf('=');
      cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    if (!response.ok) throw Object.assign(new Error(`Flowise returned HTTP ${response.status}. Check docker compose logs flowise.`), { status: response.status });
    return response.json();
  }
  const account = { email, password };
  try { await request('/auth/login', account); }
  catch (error) {
    if (![400, 401, 404].includes(error.status)) throw error;
    await request('/account/register', { user: { name: 'Local user', email, credential: password } });
    await request('/auth/login', account);
  }
  if (existsSync(idPath)) {
    const id = readFileSync(idPath, 'utf8').trim();
    await request('/chatflows/' + encodeURIComponent(id));
    return id;
  }
  // Adopt the previous installation's example without overwriting user edits.
  const name = 'Local AI — Codex or API';
  const flows = await request('/chatflows');
  if (!Array.isArray(flows)) throw new Error('Unexpected Flowise workflow list.');
  const matches = flows.filter(flow => flow.name === name && flow.type === 'AGENTFLOW');
  if (matches.length > 1) throw new Error('Multiple example workflows found. Keep one before initializing.');
  const flow = matches[0] ?? await request('/chatflows', { name, type: 'AGENTFLOW', flowData: workflow, deployed: true, isPublic: false });
  if (!flow.id) throw new Error('Flowise returned no workflow ID.');
  writeFileSync(idPath, flow.id, { mode: 0o600 });
  return flow.id;
}
