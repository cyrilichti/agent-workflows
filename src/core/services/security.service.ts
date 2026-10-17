import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export class SecurityService {
  private readonly expectedToken: Buffer;

  constructor(token: string) {
    if (typeof token !== 'string' || Buffer.byteLength(token) < 32) {
      throw new Error('Configure a bridge token of at least 32 bytes.');
    }
    this.expectedToken = Buffer.from(`Bearer ${token}`);
  }

  isAuthorized(request: IncomingMessage): boolean {
    const supplied = Buffer.from(request.headers.authorization ?? '');
    return supplied.length === this.expectedToken.length && timingSafeEqual(supplied, this.expectedToken);
  }
}
