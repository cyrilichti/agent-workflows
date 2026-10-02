import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Install only when missing: restarting Compose must not overwrite edits made in the UI.
export async function installWorkflow({ url, email, password, workflow, fetchImpl = fetch }) {
  if (!url || !email || !password) throw new Error('Configure KESTRA_URL, KESTRA_ADMIN_EMAIL and KESTRA_ADMIN_PASSWORD.');
  const headers = { Authorization: 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64') };
  const endpoint = `${url}/api/v1/main/flows`;
  const existing = await fetchImpl(`${endpoint}/local.ai/local_ai`, { headers, signal: AbortSignal.timeout(30000) });
  if (existing.ok) return 'retained';
  if (existing.status !== 404) throw new Error(`Kestra workflow lookup failed (HTTP ${existing.status}). Check credentials and docker compose logs kestra.`);
  const created = await fetchImpl(endpoint, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/x-yaml' },
    body: workflow, signal: AbortSignal.timeout(30000)
  });
  if (!created.ok) throw new Error(`Kestra workflow import failed (HTTP ${created.status}). Check docker compose logs kestra.`);
  return 'created';
}

async function main() {
  const status = await installWorkflow({
    url: process.env.KESTRA_URL,
    email: process.env.KESTRA_ADMIN_EMAIL,
    password: process.env.KESTRA_ADMIN_PASSWORD,
    workflow: readFileSync(new URL('../orchestration/demo.yaml', import.meta.url), 'utf8')
  });
  console.log(`Workflow local.ai/local_ai ${status}. Kestra: http://localhost:3000.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
