export type UsageReport = {
  phase: string | null;
  traceId?: string;
  usage: { input_tokens: number; output_tokens: number; cached_input_tokens?: number } | null;
  items: { tool?: string; outputCharacters: number }[];
};

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
