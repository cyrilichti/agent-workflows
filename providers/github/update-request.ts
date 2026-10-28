import { execFileSync } from 'node:child_process';
import type { GitHubRepository } from '../../commands/resolve-version-repository.ts';

export function replaceDescription(repository: GitHubRepository, requestId: number, body: string): void {
  execFileSync('gh', [
    'api', '--hostname', repository.host, '--method', 'PATCH', '--input', '-',
    `repos/${repository.owner}/${repository.repo}/pulls/${requestId}`,
  ], { encoding: 'utf8', input: JSON.stringify({ body }) });
}

export function markReady(repository: GitHubRepository, requestId: number,
  title: string | undefined, draft: boolean): void {
  if (title !== undefined) {
    execFileSync('gh', [
      'api', '--hostname', repository.host, '--method', 'PATCH', '--input', '-',
      `repos/${repository.owner}/${repository.repo}/pulls/${requestId}`,
    ], { encoding: 'utf8', input: JSON.stringify({ title }) });
  }
  if (draft) {
    execFileSync('gh', ['pr', 'ready', String(requestId), '--repo',
      `${repository.host}/${repository.owner}/${repository.repo}`], { encoding: 'utf8' });
  }
}
