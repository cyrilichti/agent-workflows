#!/usr/bin/env node

import { lstat, readFile, readdir, realpath, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, isAbsolute, join } from 'node:path';

const MAX_DEPTH = 4;
const MAX_DIRECTORIES = 10_000;
const SKIP_DIRECTORIES = new Set(['.git', 'node_modules']);

function normalize(name) {
  return name.toLowerCase().replace(/[\s.-]/gu, '');
}

function matchKind(directoryName, name) {
  if (normalize(directoryName) === name) return 'exact';
  const parts = directoryName.toLowerCase().split(/[\s.-]+/u).filter(Boolean);
  let prefix = '';
  for (const part of parts.slice(0, -1)) {
    prefix += part;
    if (prefix === name) return 'prefix';
  }
  return null;
}

function resultForMatches(matches) {
  const preferred = matches.exact.size > 0 ? matches.exact : matches.prefix;
  if (preferred.size === 1) return { path: [...preferred][0] };
  if (preferred.size > 1) return { status: 'multiple matches' };
  return null;
}

function projectPaths(config) {
  const paths = [];
  for (const line of config.split(/\r?\n/u)) {
    if (!/^\s*\[projects\./u.test(line)) continue;
    const match = line.match(/^\s*\[projects\.((?:"(?:\\.|[^"\\])*"|'[^']*'))\]\s*(?:#.*)?$/u);
    if (!match) throw new Error('Unsupported Codex project entry');
    const key = match[1];
    paths.push(key.startsWith('"') ? JSON.parse(key) : key.slice(1, -1));
  }
  return paths;
}

async function isRepository(path) {
  try {
    const marker = await lstat(join(path, '.git'));
    return marker.isDirectory() || marker.isFile();
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function configuredMatches(name, home) {
  const configPath = join(process.env.CODEX_HOME || join(home, '.codex'), 'config.toml');
  let config;
  try {
    config = await readFile(configPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return { exact: new Set(), prefix: new Set() };
    throw error;
  }

  const matches = { exact: new Set(), prefix: new Set() };
  for (const path of projectPaths(config)) {
    if (!isAbsolute(path)) continue;
    const kind = matchKind(basename(path), name);
    if (!kind) continue;
    try {
      if ((await stat(path)).isDirectory() && await isRepository(path)) {
        matches[kind].add(await realpath(path));
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return matches;
}

async function fallbackMatches(name, home) {
  const queue = [{ path: home, depth: 0 }];
  const matches = { exact: new Set(), prefix: new Set() };
  let inspected = 0;

  while (queue.length > 0) {
    if (inspected === MAX_DIRECTORIES) return { status: 'search limit reached' };
    const { path, depth } = queue.shift();
    inspected += 1;

    const kind = matchKind(basename(path), name);
    if (kind && await isRepository(path)) {
      matches[kind].add(await realpath(path));
      if (matches.exact.size > 1) return { status: 'multiple matches' };
    }
    if (depth === MAX_DEPTH) continue;

    let entries;
    try {
      entries = await readdir(path, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        return { status: 'search incomplete' };
      }
      throw error;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isDirectory() && !SKIP_DIRECTORIES.has(entry.name)) {
        queue.push({ path: join(path, entry.name), depth: depth + 1 });
      }
    }
  }

  return resultForMatches(matches) || { status: 'not found' };
}

async function main() {
  const [list] = process.argv.slice(2);
  if (!list || process.argv.length !== 3 || !normalize(list)) {
    return { status: 'invalid list' };
  }
  const home = homedir();
  const matches = await configuredMatches(normalize(list), home);
  const configuredResult = resultForMatches(matches);
  if (configuredResult) return configuredResult;
  return fallbackMatches(normalize(list), home);
}

try {
  process.stdout.write(`${JSON.stringify(await main())}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
