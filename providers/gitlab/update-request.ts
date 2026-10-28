import { execFileSync } from 'node:child_process';
import type { GitLabRepository } from '../../commands/resolve-version-repository.ts';

export function replaceDescription(repository: GitLabRepository, requestId: number, body: string): void {
  execFileSync('glab', [
    'mr', 'update', String(requestId), '--repo', repository.url,
    '--description', body, '--yes',
  ], { encoding: 'utf8' });
}

export function markReady(repository: GitLabRepository, requestId: number,
  title: string | undefined): void {
  const args = ['mr', 'update', String(requestId), '--repo', repository.url, '--ready', '--yes'];
  if (title !== undefined) args.push('--title', title);
  execFileSync('glab', args, { encoding: 'utf8' });
}
