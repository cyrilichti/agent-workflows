import { execFileSync } from 'node:child_process';
import type { GitLabRepository } from '../../commands/resolve-version-repository.ts';

export function squashMerge(repository: GitLabRepository, requestId: number, headSha: string): void {
  execFileSync('glab', ['mr', 'merge', String(requestId), '--repo', repository.url,
    '--squash', '--sha', headSha, '--auto-merge=false', '--yes'], { encoding: 'utf8' });
}
