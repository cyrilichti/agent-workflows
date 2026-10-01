import { readFileSync } from 'node:fs';
import { installWorkflow } from './kestra.mjs';

try {
  const status = await installWorkflow({
    url: process.env.KESTRA_URL,
    email: process.env.KESTRA_ADMIN_EMAIL,
    password: process.env.KESTRA_ADMIN_PASSWORD,
    workflow: readFileSync(new URL('./workflow.yaml', import.meta.url), 'utf8')
  });
  console.log(`Workflow local.ai/local_ai ${status}. Kestra: http://localhost:3000.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
