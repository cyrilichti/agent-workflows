export type InstallWorkflowOptions = {
  url?: string | undefined; email?: string | undefined; password?: string | undefined; workflow: string;
  namespace: string; id: string; fetchImpl?: typeof fetch;
};
