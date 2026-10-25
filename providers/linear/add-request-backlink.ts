import { execFileSync } from 'node:child_process';

export function addBacklink(itemId: string, comment: string) {
  const output = execFileSync('linear', [
    'issue', 'comment', 'add', itemId, '--body-file', '-', '--yes', '--no-input',
  ], { input: comment, encoding: 'utf8' });
  return output.trim();
}
