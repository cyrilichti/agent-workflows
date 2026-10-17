import type { ServerResponse } from 'node:http';
import { HTTP_ERROR_STATUSES } from '../config/keys.ts';
import { HttpError } from '../core/errors/http.error.ts';
import { ProviderError } from '../errors/provider.error.ts';
import type { TaskResponseEntity } from '../entities/task-response.entity.ts';
import { JsonHttpResponseService } from '../core/services/json-http-response.service.ts';

export class TaskHttpResponseService {
  private readonly json = new JsonHttpResponseService();

  sendTask(response: ServerResponse, result: TaskResponseEntity): void {
    const status = result.status === 'completed' ? 200 : result.status === 'unknown' ? 504 : 502;
    this.json.send(response, status, result);
  }

  sendError(response: ServerResponse, error: unknown): void {
    if (error instanceof HttpError) {
      this.json.send(response, error.status, { error: error.code });
      return;
    }
    const code = error instanceof ProviderError ? error.code : 'internal_error';
    const status = HTTP_ERROR_STATUSES[code];
    this.json.send(response, status ?? 500, {
      error: status ? code : 'internal_error',
      message: status && error instanceof Error ? error.message : 'Local service failed.',
    });
  }
}
