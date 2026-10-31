import type { createWebPushSender } from '@angia/web-push';
import type { ReminderNotifier } from '../application/ports.js';

export type WebPushSender = Pick<ReturnType<typeof createWebPushSender>, 'send'>;

// SPEC-027/044, BR-040: payload chỉ có loại và id; service worker chọn nội dung và đường dẫn cố định.
export function createReminderNotifier(sender: WebPushSender): ReminderNotifier {
  return {
    send: (subscription, reminderId, ttlSeconds, kind) =>
      sender.send(
        subscription,
        { type: kind === 'revisit' ? 'revisit-reminder' : 'medication-reminder', reminderId },
        { ttlSeconds, urgency: 'high' },
      ),
  };
}
