import type { ServerResponse } from 'node:http';
export class JsonHttpResponseService {
  send(response: ServerResponse, status: number, value: unknown): void {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(value));
  }
}
