import { createWebPushSender as createSharedSender } from '@angia/web-push';
import type { PushSender } from '../application/ports.js';

/** Adapter E8: ánh xạ kết quả chung của package sang cổng PushSender (accepted | gone | failed). */
export function createWebPushSender(
  vapid: { publicKey: string; privateKey: string; subject: string } | null,
): PushSender {
  const sender = createSharedSender(vapid);
  return {
    async send(value) {
      const result = await sender.send(value, { type: 'test' }, { ttlSeconds: 60, urgency: 'high' });
      if (result.kind === 'accepted') return 'accepted';
      return result.kind === 'gone' ? 'gone' : 'failed';
    },
  };
}
