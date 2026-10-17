import type { ChildProcess, SpawnOptions } from 'node:child_process';

export type SpawnProcess = (command: string, args: readonly string[], options: SpawnOptions) => ChildProcess;

export type ProviderOptions = {
  model?: string | undefined; workspace?: string | undefined; executable?: string | undefined;
  environment?: NodeJS.ProcessEnv | undefined; directory?: string | undefined;
  key?: string | undefined; keyFile?: string | undefined;
};

export type OpenAiResponse = {
  status?: string; model?: string; id?: string;
  output?: { type: string; content?: { type: string; text?: string }[] }[];
  usage?: { input_tokens: number; output_tokens: number; input_tokens_details?: { cached_tokens?: number } };
};

export type CodexProviderOptions = {
  model?: string | undefined; workspace?: string | undefined; executable?: string | undefined;
  environment?: NodeJS.ProcessEnv | undefined; directory?: string | undefined; spawnImpl?: SpawnProcess;
};

export type OpenAiProviderOptions = {
  model: string; key?: string | undefined; keyFile?: string | undefined; fetchImpl?: typeof fetch;
};

export type CodexRunContext = {
  directory: string; prompt: string; traceId?: string | undefined;
  phase?: string | undefined; requestId?: string | undefined;
};

export type CodexRunState = {
  output: string;
  pendingLine: string;
  itemCompletedAt: string[];
  failure?: import('../errors/provider.error.ts').ProviderError;
};
