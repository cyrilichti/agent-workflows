import type { ChildProcess } from 'node:child_process';

export class ProcessGroupService {
  terminate(child: ChildProcess): void {
    try {
      if (child.pid !== undefined) process.kill(-child.pid, 'SIGKILL');
    } catch {
      // The process may already have exited or failed to spawn.
    }
  }
}
