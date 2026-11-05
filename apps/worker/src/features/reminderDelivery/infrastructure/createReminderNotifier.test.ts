import { describe, expect, it } from 'vitest';
import { createReminderNotifier } from './createReminderNotifier.js';

const SUBSCRIPTION = { endpoint: 'https://push.example/1', keys: { p256dh: 'p', auth: 'a' } };

describe('createReminderNotifier (SPEC-027 §5.2)', () => {
  it('gửi payload chung chỉ gồm type + reminderId, urgency high, TTL theo cửa sổ; trả nguyên kết quả', async () => {
    const calls: unknown[][] = [];
    const notifier = createReminderNotifier({
      send: async (...args) => {
        calls.push(args);
        return { kind: 'retry', code: 'http_429', retryAfterSeconds: 30 };
      },
    });

    const outcome = await notifier.send(SUBSCRIPTION, 'reminder-1', 1800, 'medication');

    expect(outcome).toEqual({ kind: 'retry', code: 'http_429', retryAfterSeconds: 30 });
    expect(calls).toEqual([
      [
        SUBSCRIPTION,
        { type: 'medication-reminder', reminderId: 'reminder-1' },
        { ttlSeconds: 1800, urgency: 'high' },
      ],
    ]);
  });
});
