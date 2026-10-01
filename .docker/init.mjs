import { readFileSync } from 'node:fs';
import { installFlowise } from './flowise.mjs';

try {
  const id = await installFlowise({
    url: process.env.FLOWISE_URL,
    email: process.env.FLOWISE_ADMIN_EMAIL,
    password: process.env.FLOWISE_ADMIN_PASSWORD,
    workflow: readFileSync(new URL('./workflow.json', import.meta.url), 'utf8'),
    idPath: '/state/agent-workflows-flow-id'
  });
  console.log(`Workflow ready: ${id}. Open Flowise at http://localhost:3000.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
