import { describe, expect, it } from 'vitest';
import type { SendOutcome } from '../domain/DeliveryTypes.js';
import type { ReminderNotifier } from './ports.js';
import { createMemoryDeliveryRepository } from '@src/shared/test/createMemoryDeliveryRepository.js';
import { sendReminders } from './sendReminders.js';
import { fakeNotifier, fam, family, NOW, plus, SCHEDULED } from './sendReminders.test-helper.js';

// Đồng hồ giả: mỗi lần gửi push tốn `stepMs`, giống HTTP tuần tự có timeout.
function slowClock(start: Date, stepMs: number) {
  let current = start.getTime();
  const sent: { endpoint: string; ttlSeconds: number; at: Date }[] = [];
  const notifier: ReminderNotifier = {
    send: async (subscription, _reminderId, ttlSeconds) => {
      sent.push({ endpoint: subscription.endpoint, ttlSeconds, at: new Date(current) });
      current += stepMs;
      return { kind: 'accepted' };
    },
  };
  return { now: () => new Date(current), notifier, sent };
}

describe('sendReminders — đồng hồ theo từng đích và tín hiệu hủy (SPEC-027 §5.2)', () => {
  it('Đồng hồ vượt cửa sổ giữa lượt → đích sau thành expired, không gửi', async () => {
    const data = family();
    const repository = createMemoryDeliveryRepository({ [fam(1)]: data });
    const start = new Date(plus(59, SCHEDULED).getTime() + 50_000);
    const clock = slowClock(start, 15_000);
    const result = await sendReminders(repository, clock.notifier, { now: clock.now });
    expect(clock.sent.map((s) => s.endpoint)).toEqual(['https://push.example/1']);
    expect(result.totals).toMatchObject({ accepted: 1, expired: 1 });
    expect(data.deliveries.map((d) => d.status)).toEqual(['accepted', 'expired']);
    expect(data.deliveries[0]?.acceptedAt).toEqual(new Date(start.getTime() + 15_000));
  });

  it('TTL tính theo giờ lúc gửi từng đích, không theo giờ bắt đầu lượt', async () => {
    const repository = createMemoryDeliveryRepository({ [fam(1)]: family() });
    const clock = slowClock(NOW, 10 * 60_000);
    await sendReminders(repository, clock.notifier, { now: clock.now });
    expect(clock.sent.map((s) => s.ttlSeconds)).toEqual([55 * 60, 45 * 60]);
  });

  it('Tín hiệu hủy bật giữa lượt → dừng gửi tiếp, aborted: true, đích còn lại vẫn pending', async () => {
    const one = family();
    const two = family();
    const repository = createMemoryDeliveryRepository({ [fam(1)]: one, [fam(2)]: two });
    const controller = new AbortController();
    const { notifier, calls } = fakeNotifier(() => {
      controller.abort();
      return { kind: 'accepted' };
    });
    const result = await sendReminders(repository, notifier, { now: () => NOW, signal: controller.signal });
    expect(calls).toHaveLength(1);
    expect(result.aborted).toBe(true);
    expect(one.deliveries.map((d) => d.status)).toEqual(['accepted', 'pending']);
    expect(two.deliveries).toHaveLength(0);
  });

  it('Tín hiệu đã hủy từ đầu → không fan-out, không gửi', async () => {
    const repository = createMemoryDeliveryRepository({ [fam(1)]: family() });
    const { notifier, calls } = fakeNotifier();
    const controller = new AbortController();
    controller.abort();
    const result = await sendReminders(repository, notifier, { now: () => NOW, signal: controller.signal });
    expect(calls).toHaveLength(0);
    expect(repository.fanOutCalls()).toEqual([]);
    expect(result.aborted).toBe(true);
  });

  it('failedByCode đếm đích failed theo mã lỗi (chỉ mã, không endpoint)', async () => {
    const repository = createMemoryDeliveryRepository({ [fam(1)]: family() });
    const outcome = (endpoint: string): SendOutcome =>
      endpoint.endsWith('/1')
        ? { kind: 'rejected', code: 'http_4xx' }
        : { kind: 'rejected', code: 'not_allowed' };
    const result = await sendReminders(repository, fakeNotifier(outcome).notifier, { now: () => NOW });
    expect(result.totals.failed).toBe(2);
    expect(result.failedByCode).toEqual({ http_4xx: 1, not_allowed: 1 });
  });

  it('Không có đích failed → failedByCode rỗng', async () => {
    const repository = createMemoryDeliveryRepository({ [fam(1)]: family() });
    const result = await sendReminders(repository, fakeNotifier().notifier, { now: () => NOW });
    expect(result.failedByCode).toEqual({});
  });
});
