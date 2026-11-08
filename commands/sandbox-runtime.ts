import { spawnSync } from 'node:child_process';

export type Run = (program: string, args: string[], cwd?: string) => { stdout: string; stderr: string };
export const run: Run = (program, args, cwd) => {
  const result = spawnSync(program, args, { cwd, encoding: 'utf8', timeout: 300_000, maxBuffer: 32 * 1024 * 1024 });
  // Compose output can contain resolved credentials. Never include it in a failure.
  if (result.error || result.status !== 0) throw new Error(`${program} ${args[0] ?? ''} failed (${result.error ? 'unavailable or timed out' : `exit ${result.status}`}).`);
  return { stdout: result.stdout, stderr: result.stderr };
};
