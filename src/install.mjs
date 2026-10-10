import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { load, dump } from 'js-yaml';

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

/** Render the managed controller using a positive, whole-second interval. */
export function renderWorkLoop(workflow, configuration) {
  const config = load(configuration) ?? {};
  const orchestration = config.orchestration;
  const loop = orchestration?.workLoop;
  for (const [name, value] of [['configuration', config], ['orchestration', orchestration], ['orchestration.workLoop', loop]]) {
    if (value !== undefined && (value === null || typeof value !== 'object' || Array.isArray(value))) {
      throw new Error(`${name} must be a YAML mapping.`);
    }
  }
  const seconds = loop?.intervalSeconds === undefined ? 300 : loop.intervalSeconds;
  if (!Number.isSafeInteger(seconds) || seconds <= 0 || seconds > 2147483647) {
    throw new Error('orchestration.workLoop.intervalSeconds must be an integer between 1 and 2147483647.');
  }
  const flow = load(workflow);
  flow.tasks.find(task => task.id === 'loop').checkFrequency.interval = `PT${seconds}S`;
  return dump(flow, { lineWidth: -1, noRefs: true });
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
  const loop = renderWorkLoop(readFileSync(new URL('../orchestration/work_loop.yaml', import.meta.url), 'utf8'), configuration);
  for (const { namespace, id, file, managed = false } of [
    { namespace: 'demo', id: 'demo', file: 'demo.yaml' },
    { namespace: 'agent_workflows', id: 'work', file: 'work.yaml' },
    { namespace: 'agent_workflows', id: 'work_loop', managed: true },
  ]) {
    const status = await installWorkflow({
      url: process.env.KESTRA_URL,
      email: process.env.KESTRA_ADMIN_EMAIL,
      password: process.env.KESTRA_ADMIN_PASSWORD,
      namespace,
      id,
      managed,
      workflow: managed ? loop : readFileSync(new URL(`../orchestration/${file}`, import.meta.url), 'utf8'),
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
