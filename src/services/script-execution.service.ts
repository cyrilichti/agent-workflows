import { spawn } from 'node:child_process';
import { realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { PROJECT_ROOT } from '../config/keys.ts';
import { HttpError } from '../core/errors/http.error.ts';
import { ProcessGroupService } from '../core/services/process-group.service.ts';

export type ScriptInput = { path: string; args?: string[] };
export type ScriptOutput = { stdout: string; stderr: string };

export class ScriptExecutionService {
  private readonly directory: string;
  private readonly limits: { timeoutMs: number; maxOutputBytes: number };

  constructor(directory = PROJECT_ROOT, limits = { timeoutMs: 285_000, maxOutputBytes: 1024 * 1024 }) {
    this.directory = directory;
    this.limits = limits;
  }

  async execute(input: unknown): Promise<ScriptOutput> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new HttpError(400, 'invalid_script_input');
    }
    const { path, args = [] } = input as Record<string, unknown>;
    if (typeof path !== 'string' || !path.trim() || path.includes('\0') ||
      isAbsolute(path) || extname(path) !== '.ts' || !Array.isArray(args) ||
      !args.every(arg => typeof arg === 'string' && !arg.includes('\0'))) {
      throw new HttpError(400, 'invalid_script_input');
    }

    let directory: string;
    try {
      directory = await realpath(this.directory);
    } catch {
      throw new HttpError(500, 'script_project_unavailable');
    }
    const inside = (target: string) => {
      const path = relative(directory, target);
      return path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);
    };
    const candidate = resolve(directory, path);
    if (!inside(candidate)) throw new HttpError(400, 'invalid_script_path');
    let command: string;
    try {
      command = await realpath(candidate);
      if (!inside(command) || extname(command) !== '.ts' || !(await stat(command)).isFile()) {
        throw new Error('Invalid entrypoint');
      }
    } catch {
      throw new HttpError(400, 'invalid_script_path');
    }

    const child = spawn(process.execPath, [command, ...args], {
      cwd: directory, detached: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'],
    });
    return new Promise((resolve, reject) => {
      const output: ScriptOutput = { stdout: '', stderr: '' };
      let bytes = 0;
      let failure: HttpError | undefined;
      const fail = (error: HttpError) => {
        failure ??= error;
        new ProcessGroupService().terminate(child);
      };
      const timer = setTimeout(() => fail(new HttpError(504, 'script_timeout')), this.limits.timeoutMs);
      for (const stream of ['stdout', 'stderr'] as const) {
        child[stream].setEncoding('utf8');
        child[stream].on('data', (chunk: string) => {
          bytes += Buffer.byteLength(chunk);
          if (bytes > this.limits.maxOutputBytes) fail(new HttpError(502, 'script_output_too_large'));
          if (!failure) output[stream] += chunk;
        });
      }
      child.on('error', () => { failure ??= new HttpError(502, 'script_failed'); });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (failure) reject(failure);
        else if (code !== 0) reject(new HttpError(502, 'script_failed'));
        else resolve(output);
      });
    });
  }
}
