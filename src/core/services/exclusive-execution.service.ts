export class ExclusiveExecutionService {
  private controller: AbortController | null = null;

  async run<T>(operation: (signal: AbortSignal) => Promise<T>, busyError: Error): Promise<T> {
    if (this.controller) throw busyError;
    this.controller = new AbortController();
    try {
      return await operation(this.controller.signal);
    } finally {
      this.controller = null;
    }
  }

  cancel(): void {
    this.controller?.abort();
  }
}
