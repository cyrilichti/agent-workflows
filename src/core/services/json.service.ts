export class JsonService {
  parse<T = unknown>(source: string): T {
    return JSON.parse(source) as T;
  }

  parseOrNull<T = unknown>(source: string): T | null {
    try {
      return this.parse<T>(source);
    } catch {
      return null;
    }
  }

  stringify(value: unknown): string {
    return JSON.stringify(value);
  }
}
