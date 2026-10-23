import type { createWebPushSender } from '@angia/web-push';
import type { ReminderNotifier } from '../application/ports.js';

export type WebPushSender = Pick<ReturnType<typeof createWebPushSender>, 'send'>;

// SPEC-027 §5.2 / BR-040: payload chung, không tên thuốc/hồ sơ — service worker tự mở /reminders/<id>.
export function createReminderNotifier(sender: WebPushSender): ReminderNotifier {
  return {
    send: (subscription, reminderId, ttlSeconds) =>
      sender.send(subscription, { type: 'medication-reminder', reminderId }, { ttlSeconds, urgency: 'high' }),
  };
}
