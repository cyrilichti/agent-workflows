import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { PROJECT_ROOT } from '../config/keys.ts';
import { HttpError } from '../core/errors/http.error.ts';

const run = promisify(execFile);

export type ProjectResolution = { path: string } | { status: 'not found' | 'search incomplete' };

export class ProjectResolutionService {
  private readonly directory: string;
  private readonly command: string;

  constructor(directory = PROJECT_ROOT) {
    this.directory = directory;
    const installed = join(directory, '.agents/commands/resolve-local-project-directory.ts');
    this.command = existsSync(installed)
      ? installed : join(directory, 'commands/resolve-local-project-directory.ts');
  }

  async resolve(input: unknown): Promise<ProjectResolution> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new HttpError(400, 'invalid_project_input');
    }
    const { list, id } = input as Record<string, unknown>;
    if (typeof list !== 'string' || !list.trim() || typeof id !== 'string' || !id.trim()) {
      throw new HttpError(400, 'invalid_project_input');
    }

    let stdout: string;
    try {
      ({ stdout } = await run(process.execPath, [this.command, list, id], {
        cwd: this.directory,
        timeout: 285_000,
        maxBuffer: 1024 * 1024,
      }));
    } catch (error) {
      const timedOut = error instanceof Error && 'killed' in error && error.killed === true;
      throw new HttpError(timedOut ? 504 : 502, timedOut ? 'project_timeout' : 'project_failed');
    }

    let result: unknown;
    try {
      result = JSON.parse(stdout);
    } catch {
      throw new HttpError(502, 'invalid_project_result');
    }
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw new HttpError(502, 'invalid_project_result');
    }
    const value = result as Record<string, unknown>;
    if (Object.keys(value).length === 1 && typeof value.path === 'string' && value.path.trim()) {
      return { path: value.path };
    }
    if (Object.keys(value).length === 1 &&
      (value.status === 'not found' || value.status === 'search incomplete')) {
      return { status: value.status };
    }
    throw new HttpError(502, 'invalid_project_result');
  }
}
