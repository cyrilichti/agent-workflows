import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { PROJECT_ROOT } from '../config/keys.ts';
import { HttpError } from '../core/errors/http.error.ts';

const run = promisify(execFile);
const command = join(PROJECT_ROOT, 'commands/select-next-item.ts');

export type NextSelection =
  | { name: string; id: string; url: string; list: string }
  | { status: 'no eligible item' };

function isItem(value: Record<string, unknown>): boolean {
  return ['name', 'id', 'url', 'list'].every(key =>
    typeof value[key] === 'string' && (value[key] as string).trim().length > 0);
}

export class NextSelectionService {
  async select(): Promise<NextSelection> {
    let stdout: string;
    try {
      ({ stdout } = await run(process.execPath, [command], {
        cwd: PROJECT_ROOT,
        timeout: 60_000,
        maxBuffer: 1024 * 1024,
      }));
    } catch (error) {
      const timedOut = error instanceof Error && 'killed' in error && error.killed === true;
      throw new HttpError(timedOut ? 504 : 502, timedOut ? 'selection_timeout' : 'selection_failed');
    }

    let result: unknown;
    try {
      result = JSON.parse(stdout);
    } catch {
      throw new HttpError(502, 'invalid_selection');
    }
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw new HttpError(502, 'invalid_selection');
    }
    const value = result as Record<string, unknown>;
    if (value.status === 'no eligible item' && Object.keys(value).length === 1) {
      return { status: 'no eligible item' };
    }
    if (!isItem(value)) {
      throw new HttpError(502, 'invalid_selection');
    }
    return { name: value.name as string, id: value.id as string,
      url: value.url as string, list: value.list as string };
  }
}
