import { describe, expect, it } from 'vitest';
import type { PushSubscriptionShape, SendOutcome } from '../domain/DeliveryTypes.js';
import type { ReminderNotifier } from './ports.js';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';
import {
  createMemoryDeliveryRepository,
  type MemoryDeliveryFamily,
  type MemoryDevice,
} from '@src/shared/test/createMemoryDeliveryRepository.js';
import { sendReminders } from './sendReminders.js';

const fam = (n: number) => `0199a000-0000-7000-8000-${String(n).padStart(12, '0')}`;
const id = (n: number) => `0199b000-0000-7000-8000-${String(n).padStart(12, '0')}`;
const NOW = new Date('2026-10-23T00:05:00.000Z');
const SCHEDULED = new Date('2026-10-23T00:00:00.000Z');
const plus = (minutes: number, base = NOW) => new Date(base.getTime() + minutes * 60_000);
const MAIN_A: FamilyAccount = { id: id(1), role: 'main', healthProfileId: null };
const MAIN_B: FamilyAccount = { id: id(2), role: 'main', healthProfileId: null };
const PROFILE = id(10);
const REMINDER = id(20);

const device = (n: number, accountId: string): MemoryDevice => ({
  id: id(30 + n),
  accountId,
  subscription: { endpoint: `https://push.example/${n}`, keys: { p256dh: 'p', auth: 'a' } },
});

function family(overrides: Partial<MemoryDeliveryFamily> = {}): MemoryDeliveryFamily {
  return {
    accounts: [MAIN_A, MAIN_B],
    profiles: [{ profileId: PROFILE, consentConfirmed: true, assignedAccountIds: [MAIN_A.id, MAIN_B.id] }],
    reminders: [{ reminderId: REMINDER, profileId: PROFILE, scheduledAt: SCHEDULED, sentAt: null }],
    devices: [device(1, MAIN_A.id), device(2, MAIN_B.id)],
    deliveries: [],
    ...overrides,
  };
}

function fakeNotifier(outcomeFor: (endpoint: string) => SendOutcome = () => ({ kind: 'accepted' })) {
  const calls: { subscription: PushSubscriptionShape; reminderId: string; ttlSeconds: number }[] = [];
  const notifier: ReminderNotifier = {
    send: async (subscription, reminderId, ttlSeconds) => {
      calls.push({ subscription, reminderId, ttlSeconds });
      return outcomeFor(subscription.endpoint);
    },
  };
  return { notifier, calls };
}

describe('sendReminders (SPEC-027 §5)', () => {
  it('TC-091: A accepted, B retry → lượt 2 tại +1′ chỉ gửi lại cho B', async () => {
    const repository = createMemoryDeliveryRepository({ [fam(1)]: family() });
    const { notifier, calls } = fakeNotifier((endpoint) =>
      endpoint.endsWith('/1') ? { kind: 'accepted' } : { kind: 'retry', code: 'http_5xx' },
    );
    const first = await sendReminders(repository, notifier, { now: () => NOW });
    expect(first.totals).toMatchObject({ fannedOut: 1, accepted: 1, retried: 1 });
    expect(calls.map((c) => c.subscription.endpoint)).toEqual([
      'https://push.example/1',
      'https://push.example/2',
    ]);
    expect(calls[0]?.ttlSeconds).toBe(55 * 60);

    calls.length = 0;
    const second = await sendReminders(repository, notifier, { now: () => plus(1) });
    expect(calls.map((c) => c.subscription.endpoint)).toEqual(['https://push.example/2']);
    expect(second.totals).toMatchObject({ fannedOut: 0, accepted: 0, retried: 1 });
  });

  it('Fan-out: 2 main đã chỉ định, mỗi người 1 thiết bị → 2 đích pending', async () => {
    const data = family();
    const repository = createMemoryDeliveryRepository({ [fam(1)]: data });
    await sendReminders(repository, fakeNotifier().notifier, { now: () => NOW });
    expect(repository.fanOutCalls()).toEqual([[REMINDER, [id(31), id(32)], NOW]]);
    expect(data.deliveries).toHaveLength(2);
  });

  it('Quá 60′ trước fan-out → không đích, expiredBeforeFanout 1, vẫn đánh dấu đã fan-out', async () => {
    const repository = createMemoryDeliveryRepository({ [fam(1)]: family() });
    const { notifier, calls } = fakeNotifier();
    const late = plus(61, SCHEDULED);
    const result = await sendReminders(repository, notifier, { now: () => late });
    expect(result.totals).toMatchObject({ fannedOut: 0, expiredBeforeFanout: 1 });
    expect(repository.fanOutCalls()).toEqual([[REMINDER, [], late]]);
    expect(calls).toHaveLength(0);
  });

  it('Hồ sơ chưa đồng thuận hoặc không có người nhận → markFannedOut với 0 đích', async () => {
    const noConsent = family({
      profiles: [{ profileId: PROFILE, consentConfirmed: false, assignedAccountIds: [MAIN_A.id] }],
    });
    const noRecipient = family({
      profiles: [{ profileId: PROFILE, consentConfirmed: true, assignedAccountIds: [] }],
    });
    for (const data of [noConsent, noRecipient]) {
      const repository = createMemoryDeliveryRepository({ [fam(1)]: data });
      const result = await sendReminders(repository, fakeNotifier().notifier, { now: () => NOW });
      expect(repository.fanOutCalls()).toEqual([[REMINDER, [], NOW]]);
      expect(result.totals.fannedOut).toBe(1);
    }
  });

  it('Thiết bị bật sau fan-out không có đích (fan-out chỉ chạy khi sent_at NULL)', async () => {
    const data = family({ devices: [device(1, MAIN_A.id)] });
    const repository = createMemoryDeliveryRepository({ [fam(1)]: data });
    const { notifier, calls } = fakeNotifier();
    await sendReminders(repository, notifier, { now: () => NOW });
    data.devices.push(device(2, MAIN_B.id));
    calls.length = 0;
    await sendReminders(repository, notifier, { now: () => plus(1) });
    expect(calls).toHaveLength(0);
    expect(data.deliveries.map((d) => d.deviceId)).toEqual([id(31)]);
  });

  it('Không còn đủ điều kiện lúc gửi → revoked với mã eligibility, không gọi notifier', async () => {
    const data = family({ devices: [device(1, MAIN_A.id)] });
    const repository = createMemoryDeliveryRepository({ [fam(1)]: data });
    const { notifier, calls } = fakeNotifier(() => ({ kind: 'retry', code: 'timeout' }));
    await sendReminders(repository, notifier, { now: () => NOW });
    data.profiles[0]!.consentConfirmed = false;
    calls.length = 0;
    const result = await sendReminders(repository, notifier, { now: () => plus(1) });
    expect(calls).toHaveLength(0);
    expect(result.totals.revoked).toBe(1);
    expect(data.deliveries[0]).toMatchObject({
      status: 'revoked',
      attempts: 1,
      lastError: 'revoked_consent',
    });
  });

  it('Ngoài cửa sổ lúc gửi → expired, không gọi notifier', async () => {
    const data = family({
      devices: [device(1, MAIN_A.id)],
      deliveries: [
        {
          id: id(40),
          reminderId: REMINDER,
          deviceId: id(31),
          status: 'pending',
          attempts: 2,
          nextAttemptAt: SCHEDULED,
        },
      ],
    });
    data.reminders[0]!.sentAt = SCHEDULED;
    const repository = createMemoryDeliveryRepository({ [fam(1)]: data });
    const { notifier, calls } = fakeNotifier();
    const result = await sendReminders(repository, notifier, { now: () => plus(61, SCHEDULED) });
    expect(calls).toHaveLength(0);
    expect(result.totals.expired).toBe(1);
    expect(data.deliveries[0]).toMatchObject({ status: 'expired', attempts: 2 });
    expect(data.deliveries[0]?.lastError).toBeUndefined();
  });

  it('withFanOut của gia đình 1 lỗi → gia đình 2 vẫn xử lý; hàm không ném', async () => {
    const repository = createMemoryDeliveryRepository(
      { [fam(1)]: family(), [fam(2)]: family() },
      { failingFanOutFamilyId: fam(1) },
    );
    const result = await sendReminders(repository, fakeNotifier().notifier, { now: () => NOW });
    expect(result.failedFamilies).toBe(1);
    expect(result.totals).toMatchObject({ fannedOut: 1, accepted: 2 });
    expect(result.aborted).toBe(false);
  });

  it('listFamilyIds lỗi → aborted: true, không ném', async () => {
    const repository = createMemoryDeliveryRepository({}, { listFails: true });
    const result = await sendReminders(repository, fakeNotifier().notifier, { now: () => NOW });
    expect(result.aborted).toBe(true);
    expect(result.failedFamilies).toBe(0);
  });

  it('Dừng sau maxDeliveries đích trên toàn lượt (mọi gia đình)', async () => {
    const repository = createMemoryDeliveryRepository({ [fam(1)]: family(), [fam(2)]: family() });
    const { notifier, calls } = fakeNotifier();
    const result = await sendReminders(repository, notifier, { now: () => NOW, maxDeliveries: 3 });
    expect(calls).toHaveLength(3);
    expect(result.totals.accepted).toBe(3);
  });
});
