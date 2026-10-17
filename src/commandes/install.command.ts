import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import type { InstallWorkflowOptions } from '../types/install-workflow.types.ts';

export async function installWorkflow({ url, email, password, workflow, namespace, id, fetchImpl = fetch }: InstallWorkflowOptions): Promise<'created' | 'retained'> {
  if (!url || !email || !password) {
    throw new Error('Configure KESTRA_URL, KESTRA_ADMIN_EMAIL and KESTRA_ADMIN_PASSWORD.');
  }
  const headers = {
    Authorization: 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64'),
  };
  const endpoint = `${url}/api/v1/main/flows`;
  const existing = await fetchImpl(`${endpoint}/${namespace}/${id}`, {
    headers,
    signal: AbortSignal.timeout(30000),
  });
  if (existing.ok) {
    return 'retained';
  }
  if (existing.status !== 404) {
    throw new Error(
      `Kestra workflow lookup failed (HTTP ${existing.status}). Check credentials and docker compose logs kestra.`,
    );
  }
  const created = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/x-yaml' },
    body: workflow,
    signal: AbortSignal.timeout(30000),
  });
  if (!created.ok) {
    throw new Error(
      `Kestra workflow import failed (HTTP ${created.status}). Check docker compose logs kestra.`,
    );
  }
  return 'created';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const status = await installWorkflow({
      url: process.env.KESTRA_URL,
      email: process.env.KESTRA_ADMIN_EMAIL,
      password: process.env.KESTRA_ADMIN_PASSWORD,
      namespace: 'agent-workflows',
      id: 'work',
      workflow: readFileSync(new URL('../../orchestration/work.yaml', import.meta.url), 'utf8'),
    });
    console.log(`Workflow agent-workflows/work ${status}. Kestra: http://localhost:3000.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
