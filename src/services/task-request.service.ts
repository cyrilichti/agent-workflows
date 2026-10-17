import type { IncomingMessage } from 'node:http';
import { MAX_HTTP_BODY_BYTES } from '../config/keys.ts';
import { HttpError } from '../core/errors/http.error.ts';
import { JsonService } from '../core/services/json.service.ts';

export class TaskRequestService {
  private readonly json = new JsonService();

  async parseTaskInput(request: IncomingMessage): Promise<unknown> {
    let body = '';
    for await (const chunk of request) {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_HTTP_BODY_BYTES) {
        throw new HttpError(413, 'body_too_large');
      }
    }
    try {
      return request.headers['content-type']?.startsWith('text/plain')
        ? { prompt: body, requestId: request.headers['x-request-id'] }
        : this.json.parse(body);
    } catch {
      throw new HttpError(400, 'invalid_json');
    }
  }
}
