import type { IncomingMessage } from 'node:http';
import { MAX_HTTP_BODY_BYTES } from '../config/keys.ts';
import { HttpError } from '../core/errors/http.error.ts';
import { JsonService } from '../core/services/json.service.ts';

export class TaskRequestService {
  private readonly json = new JsonService();

  async parseTaskInput(request: IncomingMessage): Promise<unknown> {
    let body = '';
    let bytes = 0;
    request.setEncoding('utf8');
    for await (const chunk of request) {
      bytes += Buffer.byteLength(chunk);
      if (bytes > MAX_HTTP_BODY_BYTES) {
        throw new HttpError(413, 'body_too_large');
      }
      body += chunk;
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
