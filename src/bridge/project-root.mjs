import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root containing the bridge and agent workflows. */
export const PROJECT_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
