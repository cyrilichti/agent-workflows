import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Retain UI edits by default; the bundled work_loop is managed by repository configuration.
/**
 * Import one workflow only if absent, preserving edits to an existing workflow.
 *
 * @param {object} options
 * @param {string} options.url Kestra base URL.
 * @param {string} options.email Basic authentication username.
 * @param {string} options.password Basic authentication password.
 * @param {string} options.workflow YAML content to import.
 * @param {string} options.namespace Kestra namespace.
 * @param {string} options.id Kestra flow ID.
 * @param {typeof fetch} [options.fetchImpl=fetch] Injectable HTTP client.
 * @param {boolean} [options.managed=false] Apply repository changes to an existing flow.
 * @returns {Promise<"created" | "retained" | "updated">}
 * @throws {Error} For missing credentials or failed lookup/import requests.
 */
export async function installWorkflow({ url, email, password, workflow, namespace, id, managed = false, fetchImpl = fetch }) {
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
  if (existing.ok && !managed) {
    return 'retained';
  }
  if (!existing.ok && existing.status !== 404) {
    throw new Error(
      `Kestra workflow lookup failed (HTTP ${existing.status}). Check credentials and docker compose logs kestra.`,
    );
  }
  const created = await fetchImpl(existing.ok ? `${endpoint}/${namespace}/${id}` : endpoint, {
    method: existing.ok ? 'PUT' : 'POST',
    headers: { ...headers, 'Content-Type': 'application/x-yaml' },
    body: workflow,
    signal: AbortSignal.timeout(30000),
  });
  if (!created.ok) {
    throw new Error(
      `Kestra workflow import failed (HTTP ${created.status}). Check docker compose logs kestra.`,
    );
  }
  return existing.ok ? 'updated' : 'created';
}

/** Upload the raw project configuration for Kestra expressions in this namespace. */
export async function uploadNamespaceFile({ url, email, password, namespace, path, contents, fetchImpl = fetch }) {
  if (!url || !email || !password) {
    throw new Error('Configure KESTRA_URL, KESTRA_ADMIN_EMAIL and KESTRA_ADMIN_PASSWORD.');
  }
  const body = new FormData();
  body.append('fileContent', new Blob([contents], { type: 'application/x-yaml' }), path);
  const response = await fetchImpl(`${url}/api/v1/main/namespaces/${namespace}/files?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64') },
    body,
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`Kestra namespace file upload failed (HTTP ${response.status}). Check docker compose logs kestra.`);
  }
}

/** Keep the existing demo installer interface for callers. */
export async function installDemoWorkflow(options) {
  return installWorkflow({ ...options, namespace: 'demo', id: 'demo' });
}

/**
 * Load the bundled workflows and install them using environment credentials.
 *
 * @returns {Promise<void>}
 * @throws {Error} If the YAML cannot be read or installation fails.
 */
async function main() {
  const configuration = readFileSync(new URL('../agent-workflows.yaml', import.meta.url), 'utf8');
  for (const { namespace, id, file, managed = false } of [
    { namespace: 'demo', id: 'demo', file: 'demo.yaml' },
    { namespace: 'agent_workflows', id: 'work', file: 'work.yaml' },
    { namespace: 'agent_workflows', id: 'work_loop', file: 'work_loop.yaml', managed: true },
  ]) {
    if (id === 'work_loop') {
      await uploadNamespaceFile({
        url: process.env.KESTRA_URL,
        email: process.env.KESTRA_ADMIN_EMAIL,
        password: process.env.KESTRA_ADMIN_PASSWORD,
        namespace,
        path: 'agent-workflows.yaml',
        contents: configuration,
      });
    }
    const status = await installWorkflow({
      url: process.env.KESTRA_URL,
      email: process.env.KESTRA_ADMIN_EMAIL,
      password: process.env.KESTRA_ADMIN_PASSWORD,
      namespace,
      id,
      managed,
      workflow: readFileSync(new URL(`../orchestration/${file}`, import.meta.url), 'utf8'),
    });
    console.log(`Workflow ${namespace}/${id} ${status}. Kestra: http://localhost:3000.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
