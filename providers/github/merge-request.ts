import { execFileSync } from 'node:child_process';
import type { GitHubRepository } from '../../commands/resolve-version-repository.ts';

export function squashMerge(repository: GitHubRepository, requestId: number, headSha: string): void {
  const path = `repos/${repository.owner}/${repository.repo}/pulls/${requestId}/merge`;
  execFileSync('gh', ['api', '--hostname', repository.host, '--method', 'PUT', '--input', '-', path], {
    input: JSON.stringify({ sha: headSha, merge_method: 'squash' }),
    encoding: 'utf8',
  });
}
