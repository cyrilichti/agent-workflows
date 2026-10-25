export type GitHubRepository = { host: string; owner: string; repo: string };
export type GitLabRepository = { host: string; path: string; url: string };

export function resolveVersionRepository(remote: string, provider: 'github'): GitHubRepository;
export function resolveVersionRepository(remote: string, provider: 'gitlab'): GitLabRepository;
export function resolveVersionRepository(remote: string, provider: 'github' | 'gitlab'):
  GitHubRepository | GitLabRepository;
export function resolveVersionRepository(remote: string, provider: 'github' | 'gitlab'):
  GitHubRepository | GitLabRepository {
  const scp = /^git@([^:]+):(.+)$/.exec(remote);
  let host: string;
  let pathname: string;
  if (scp) {
    host = scp[1]!;
    pathname = scp[2]!;
  } else {
    const url = new URL(remote);
    host = url.host;
    pathname = url.pathname.replace(/^\//, '');
  }
  const parts = pathname.replace(/\.git$/, '').split('/').map(decodeURIComponent);
  if (provider === 'github') {
    return { host, owner: parts[0]!, repo: parts[1]! };
  }
  const path = parts.join('/');
  return { host, path, url: `https://${host}/${parts.map(encodeURIComponent).join('/')}` };
}
