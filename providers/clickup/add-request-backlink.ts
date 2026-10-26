import { execFileSync } from 'node:child_process';

export function addBacklink(itemId: string, comment: string) {
  let text = comment;
  if (comment.startsWith('@')) {
    text = `@${comment}`;
  }
  const output = execFileSync('clickup-cli', [
    'comment', 'create', '--task', itemId, '--text', text, '--output', 'json',
  ], { encoding: 'utf8' });
  return JSON.parse(output) as unknown;
}
