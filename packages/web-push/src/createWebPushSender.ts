import { createRequire } from 'node:module';
import { isAllowedPushSubscription } from './isAllowedPushSubscription.js';
import { parseRetryAfter } from './parseRetryAfter.js';
import type { PushSendResult, PushSubscriptionValue } from './PushSendResult.js';

interface VapidDetails {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export interface WebPushLibrary {
  sendNotification(
    value: PushSubscriptionValue,
    payload: string,
    options: { vapidDetails: VapidDetails; TTL: number; urgency: string; timeout: number },
  ): Promise<unknown>;
}

interface SendOptions {
  ttlSeconds: number;
  urgency: 'high' | 'normal';
}

interface PushError {
  statusCode?: number;
  code?: string;
  message?: string;
  headers?: Record<string, string | undefined>;
}

const TIMEOUT_CODES = new Set(['ETIMEDOUT', 'ESOCKETTIMEDOUT']);

function classify(error: PushError): PushSendResult {
  const status = Number(error.statusCode);
  if (status === 404 || status === 410) return { kind: 'gone' };
  if (status === 429) {
    const seconds = parseRetryAfter(error.headers?.['retry-after'], new Date());
    return seconds === undefined
      ? { kind: 'retry', code: 'http_429' }
      : { kind: 'retry', code: 'http_429', retryAfterSeconds: seconds };
  }
  if (status >= 500) return { kind: 'retry', code: 'http_5xx' };
  if (status >= 400) return { kind: 'rejected', code: 'http_4xx' };
  // web-push 3.6.7 hủy request bằng Error('Socket timeout') không có code.
  const timedOut = TIMEOUT_CODES.has(String(error.code)) || /timeout/i.test(String(error.message ?? ''));
  return { kind: 'retry', code: timedOut ? 'timeout' : 'network' };
}

export function createWebPushSender(vapid: VapidDetails | null, library?: WebPushLibrary) {
  const lib = library ?? (createRequire(import.meta.url)('web-push') as WebPushLibrary);
  return {
    async send(value: PushSubscriptionValue, payload: object, options: SendOptions): Promise<PushSendResult> {
      if (!vapid) return { kind: 'rejected', code: 'disabled' };
      if (!isAllowedPushSubscription(value)) return { kind: 'rejected', code: 'not_allowed' };
      try {
        // Thư viện dùng https.request và không tự theo redirect; không log URL/response body.
        await lib.sendNotification(value, JSON.stringify(payload), {
          vapidDetails: vapid,
          TTL: options.ttlSeconds,
          urgency: options.urgency,
          timeout: 15_000,
        });
        return { kind: 'accepted' };
      } catch (error) {
        return classify((error ?? {}) as PushError);
      }
    },
  };
}
