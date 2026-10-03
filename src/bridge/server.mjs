import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';

/**
 * Complete an HTTP response with a JSON payload.
 * @param {import('node:http').ServerResponse} response
 * @param {number} status HTTP status code.
 * @param {object} value JSON-serializable response body.
 * @returns {void}
 */
const sendJsonResponse = (response, status, value) => {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(value));
};

/**
 * Create an authenticated task endpoint and an unauthenticated health endpoint.
 * @param {object} options
 * @param {import('./execution/task-execution-service.mjs').TaskExecutionService} options.taskExecution
 * @param {string} options.token Shared bearer token of at least 32 bytes.
 * @param {string} options.providerName Provider name exposed by the health endpoint.
 * @returns {import('node:http').Server} Unbound server; the caller owns its lifecycle.
 * @throws {Error} If the bearer token is missing or too short.
 */
export function createBridgeHttpServer({ taskExecution, token, providerName }) {
  if (typeof token !== 'string' || Buffer.byteLength(token) < 32) {
    throw new Error('Configure a bridge token of at least 32 bytes.');
  }
  const expected = Buffer.from(`Bearer ${token}`);
  const server = createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      return sendJsonResponse(response, 200, {
        status: 'ok',
        provider: providerName,
        inferenceEnabled: taskExecution.enabled,
      });
    }
    const supplied = Buffer.from(request.headers.authorization ?? '');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      return sendJsonResponse(response, 401, { error: 'unauthorized' });
    }
    if (request.method !== 'POST' || request.url !== '/generate') {
      return sendJsonResponse(response, 404, { error: 'not_found' });
    }
    try {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
        if (Buffer.byteLength(body) > 65536) {
          sendJsonResponse(response, 413, { error: 'body_too_large' });
          return;
        }
      }
      let taskInput;
      try {
        taskInput = request.headers['content-type']?.startsWith('text/plain')
          ? { prompt: body, requestId: request.headers['x-request-id'] }
          : JSON.parse(body);
      } catch {
        return sendJsonResponse(response, 400, { error: 'invalid_json' });
      }
      sendJsonResponse(response, 200, await taskExecution.executeTask(taskInput));
    } catch (error) {
      const statuses = { busy: 429, disabled: 503, invalid_input: 400 };
      sendJsonResponse(response, statuses[error.code] ?? 500, {
        error: statuses[error.code] ? error.code : 'internal_error',
        message: statuses[error.code] ? error.message : 'Local service failed.',
      });
    }
  });
  server.requestTimeout = 120000; // Limit upload time; task execution has its own deadline.
  return server;
}
