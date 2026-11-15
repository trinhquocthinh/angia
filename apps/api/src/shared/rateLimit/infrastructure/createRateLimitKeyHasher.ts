import { createHmac } from 'node:crypto';
import type { KeyHasher } from '../application/ports.js';

export function createRateLimitKeyHasher(secret: string): KeyHasher {
  return (kind, key) => {
    const part = typeof key === 'string' ? key : JSON.stringify([key.ip, key.username.toLowerCase()]);
    return createHmac('sha256', secret).update(`${kind}:${part}`).digest('hex');
  };
}
