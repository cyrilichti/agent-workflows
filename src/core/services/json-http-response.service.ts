import type { ServerResponse } from 'node:http';
import { JsonService } from './json.service.ts';

export class JsonHttpResponseService {
  private readonly json = new JsonService();

  send(response: ServerResponse, status: number, value: unknown): void {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(this.json.stringify(value));
  }
}
