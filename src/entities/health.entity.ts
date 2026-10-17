export class HealthEntity {
  readonly status = 'ok';
  readonly provider: string;
  readonly inferenceEnabled: boolean;

  constructor(provider: string, inferenceEnabled: boolean) {
    this.provider = provider;
    this.inferenceEnabled = inferenceEnabled;
  }
}
