import { mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
export class Store {
  constructor(directory) { this.directory = directory; mkdirSync(directory, { recursive: true, mode: 0o700 }); }
  get(id) {
    try { return JSON.parse(readFileSync(join(this.directory, `${id}.json`), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
  }
  put(record) {
    const path = join(this.directory, `${record.requestId}.json`);
    writeFileSync(`${path}.tmp`, JSON.stringify(record), { mode: 0o600, flush: true });
    renameSync(`${path}.tmp`, path);
  }
  all() { return readdirSync(this.directory).filter(n => n.endsWith('.json')).map(n => this.get(n.slice(0, -5))); }
}
