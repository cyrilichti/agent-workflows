export type InstallWorkflowOptions = {
  url?: string | undefined; email?: string | undefined; password?: string | undefined; workflow: string;
  namespace: string; id: string; updateExisting?: boolean; fetchImpl?: typeof fetch;
};
