import { mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
/**
 * Persist task records with owner-only permissions and atomic file replacement.
 */
export class TaskRecordStore {
  /**
   * Create the record directory if needed.
   *
   * @param {string} directory Filesystem location for task records.
   * @throws {Error} If the directory cannot be created or accessed.
   */
  constructor(directory) {
    this.directory = directory;
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  }

  /**
   * Read a record; missing files represent requests not yet processed.
   *
   * @param {string} requestId Request identifier validated by the task contract.
   * @returns {import('../execution/task-contract.mjs').TaskRecord | undefined}
   * @throws {Error} For malformed JSON or filesystem errors other than a missing file.
   */
  get(requestId) {
    try {
      return JSON.parse(readFileSync(join(this.directory, `${requestId}.json`), 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Flush a temporary file to disk and atomically replace the saved record.
   *
   * @param {import('../execution/task-contract.mjs').TaskRecord} record
   * @returns {void}
   * @throws {Error} If writing or renaming the record fails.
   */
  put(record) {
    const path = join(this.directory, `${record.requestId}.json`);
    writeFileSync(`${path}.tmp`, JSON.stringify(record), { mode: 0o600, flush: true });
    renameSync(`${path}.tmp`, path);
  }

  /**
   * Load every saved JSON task record for recovery and trace delivery.
   *
   * @returns {Array<import('../execution/task-contract.mjs').TaskRecord>}
   * @throws {Error} If a record cannot be read or parsed.
   */
  all() {
    return readdirSync(this.directory)
      .filter((filename) => filename.endsWith('.json'))
      .map((filename) => this.get(filename.slice(0, -5)));
  }
}
