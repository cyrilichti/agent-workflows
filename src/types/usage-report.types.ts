export type UsagePhaseRow = {
  phase: string;
  runs: number;
  withUsage: number;
  input: number;
  cached: number;
  uncached: number;
  output: number;
  toolOutputChars: number;
};
