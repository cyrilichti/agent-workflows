/** Serializable ownership record. Persist this value to retry partial teardown. */
export interface SandboxContext {
  version: 1;
  id: string;
  item_id: string;
  root: string;
  repositories: { source: string; worktree: string }[];
  docker: { name: string } | null;
  ports: { service: string; target: number; sandbox: number; host: number; protocol: string }[];
}

export type SandboxResult =
  | { status: 'prepared' | 'completed'; sandbox_context: SandboxContext }
  | { status: 'failed'; stage: string; reason: string; sandbox_context?: SandboxContext };
