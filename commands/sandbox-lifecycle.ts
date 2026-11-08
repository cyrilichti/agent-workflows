import { chmodSync, existsSync, lstatSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, dirname, isAbsolute, join } from 'node:path';
import type { SandboxContext } from './sandbox-context.ts';
import { run, type Run } from './sandbox-runtime.ts';

const marker = '.sandbox-owner.json';

function makeRemovable(path: string): void {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) return;
  chmodSync(path, stat.mode | (stat.isDirectory() ? 0o700 : 0o600));
  if (stat.isDirectory()) for (const name of readdirSync(path)) makeRemovable(join(path, name));
}

export function recordOwnership(context: SandboxContext): void {
  writeFileSync(join(context.root, marker), JSON.stringify(context), { mode: 0o600 });
}

export function validateContext(value: any): SandboxContext {
  if (!value || value.version !== 1 || typeof value.id !== 'string' || !/^aw-[0-9a-f-]{36}$/.test(value.id) ||
      typeof value.item_id !== 'string' || !value.item_id.trim() || typeof value.root !== 'string' || !isAbsolute(value.root) ||
      !basename(value.root).startsWith('aw-sandbox-') || !Array.isArray(value.repositories) || !Array.isArray(value.ports) ||
      !(value.docker === null || value.docker?.name === value.id)) throw new Error('Invalid sandbox context.');
  const paths = new Set<string>();
  for (const entry of value.repositories) {
    if (!entry || typeof entry.source !== 'string' || !isAbsolute(entry.source) || typeof entry.worktree !== 'string' ||
        !isAbsolute(entry.worktree) || dirname(entry.worktree) !== value.root || entry.source === entry.worktree || paths.has(entry.worktree)) {
      throw new Error('Invalid sandbox worktree identity.');
    }
    paths.add(entry.worktree);
  }
  if (existsSync(value.root)) {
    if (lstatSync(value.root).isSymbolicLink() || realpathSync(value.root) !== value.root ||
        lstatSync(join(value.root, marker)).isSymbolicLink()) throw new Error('Invalid sandbox root.');
    const owner = JSON.parse(readFileSync(join(value.root, marker), 'utf8'));
    if (owner.id !== value.id || owner.root !== value.root || owner.item_id !== value.item_id ||
        JSON.stringify(owner.repositories) !== JSON.stringify(value.repositories) ||
        JSON.stringify(owner.docker) !== JSON.stringify(value.docker)) throw new Error('Sandbox ownership mismatch.');
  }
  return value;
}

/** Shared by preparation rollback and explicit teardown. Keep identities on failure. */
export function removeResources(context: SandboxContext, execute: Run = run): void {
  validateContext(context);
  if (context.docker) {
    const sandboxes = JSON.parse(execute('sbx', ['ls', '--format', 'json', '--no-input']).stdout);
    if (!Array.isArray(sandboxes)) throw new Error('Invalid sbx inventory.');
    const sandbox = sandboxes.find(sandbox => sandbox.name === context.docker!.name);
    if (sandbox) {
      if (!Array.isArray(sandbox.workspaces) || !sandbox.workspaces.includes(context.root)) throw new Error('Docker sandbox workspace ownership mismatch.');
      execute('sbx', ['rm', '--force', '--no-input', context.docker.name]);
      const remaining = JSON.parse(execute('sbx', ['ls', '--format', 'json', '--no-input']).stdout);
      if (!Array.isArray(remaining) || remaining.some(sandbox => sandbox.name === context.docker!.name)) throw new Error('Docker sandbox removal incomplete.');
    }
  }
  for (const repository of [...context.repositories].reverse()) {
    const list = execFileSync('git', ['-C', repository.source, 'worktree', 'list', '--porcelain', '-z'], { encoding: 'utf8' });
    if (list.split('\0').includes(`worktree ${repository.worktree}`)) {
      if (existsSync(repository.worktree)) makeRemovable(repository.worktree);
      execFileSync('git', ['-C', repository.source, 'worktree', 'remove', '--force', repository.worktree], { stdio: 'pipe' });
    } else if (existsSync(repository.worktree)) {
      // The root ownership record also covers a failed or interrupted Git add
      // that populated the recorded path without retaining its registration.
      makeRemovable(repository.worktree);
      rmSync(repository.worktree, { recursive: true });
    }
  }
  if (existsSync(context.root)) rmSync(context.root, { recursive: true });
}
