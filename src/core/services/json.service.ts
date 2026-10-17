export class JsonService {
  parse(source: string): unknown {
    return JSON.parse(source);
  }

  parseOrNull(source: string): unknown {
    try {
      return this.parse(source);
    } catch {
      return null;
    }
  }
}
