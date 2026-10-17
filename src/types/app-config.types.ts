import type { ProviderOptions } from './provider.types.ts';

export type AppConfig = {
  providerName: string;
  model: string | undefined;
  providerOptions: ProviderOptions;
  http: { host: string; port: number; token: string };
  execution: { enabled: boolean; timeoutMs: number };
  langfuse: {
    url: string; publicUrl: string; projectId: string; environment: string | undefined;
    publicKey: string; secretKey: string;
  };
};
