import { createRequire } from 'node:module';
import type { PushSender } from '../application/ports.js';
import type { PushSubscriptionValue } from '../domain/isAllowedPushSubscription.js';
import { isAllowedPushSubscription } from '../domain/isAllowedPushSubscription.js';
interface WebPushLibrary {
  sendNotification(
    value: PushSubscriptionValue,
    payload: string,
    options: {
      vapidDetails: { publicKey: string; privateKey: string; subject: string };
      TTL: number;
      urgency: string;
      timeout: number;
    },
  ): Promise<unknown>;
}
export function createWebPushSender(
  vapid: { publicKey: string; privateKey: string; subject: string } | null,
): PushSender {
  const require = createRequire(import.meta.url);
  const library = require('web-push') as WebPushLibrary;
  return {
    async send(value) {
      if (!vapid || !isAllowedPushSubscription(value)) return 'failed';
      try {
        // Thư viện dùng https.request và không tự theo redirect; không log URL/response body.
        await library.sendNotification(value, JSON.stringify({ type: 'test' }), {
          vapidDetails: vapid,
          TTL: 60,
          urgency: 'high',
          timeout: 15_000,
        });
        return 'accepted';
      } catch (error) {
        return [404, 410].includes(Number((error as { statusCode?: number }).statusCode)) ? 'gone' : 'failed';
      }
    },
  };
}
