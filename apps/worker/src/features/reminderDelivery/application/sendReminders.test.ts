import { describe, expect, it } from 'vitest';
import { createMemoryDeliveryRepository } from '@src/shared/test/createMemoryDeliveryRepository.js';
import { sendReminders } from './sendReminders.js';
import {
  device,
  fakeNotifier,
  fam,
  family,
  id,
  MAIN_A,
  MAIN_B,
  NOW,
  plus,
  PROFILE,
  REMINDER,
  SCHEDULED,
} from './sendReminders.test-helper.js';

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

  it('Fan-out lọc chỉ định theo từng hồ sơ: mỗi lời nhắc chỉ tới thiết bị của người được chỉ định', async () => {
    const OTHER_PROFILE = id(11);
    const OTHER_REMINDER = id(21);
    const data = family({
      profiles: [
        { profileId: PROFILE, consentConfirmed: true, assignedAccountIds: [MAIN_A.id] },
        { profileId: OTHER_PROFILE, consentConfirmed: true, assignedAccountIds: [MAIN_B.id] },
      ],
      reminders: [
        { reminderId: REMINDER, profileId: PROFILE, scheduledAt: SCHEDULED, sentAt: null },
        { reminderId: OTHER_REMINDER, profileId: OTHER_PROFILE, scheduledAt: SCHEDULED, sentAt: null },
      ],
    });
    const repository = createMemoryDeliveryRepository({ [fam(1)]: data });
    await sendReminders(repository, fakeNotifier().notifier, { now: () => NOW });
    expect(repository.fanOutCalls()).toEqual([
      [REMINDER, [id(31)], NOW],
      [OTHER_REMINDER, [id(32)], NOW],
    ]);
  });

  it('Quá 60′ trước fan-out → không đích, expiredBeforeFanout 1, vẫn đánh dấu đã fan-out', async () => {
    const repository = createMemoryDeliveryRepository({ [fam(1)]: family() });
    const { notifier, calls } = fakeNotifier();
    const late = plus(61, SCHEDULED);
    const result = await sendReminders(repository, notifier, { now: () => late });
    expect(result.totals).toMatchObject({ fannedOut: 0, expiredBeforeFanout: 1 });
    expect(result.expiredBeforeFanoutReminderIds).toEqual([REMINDER]);
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

  it('Vừa ngoài cửa sổ vừa mất đồng thuận → expired (cửa sổ kiểm trước), không lastError', async () => {
    const data = family({
      devices: [device(1, MAIN_A.id)],
      deliveries: [
        {
          id: id(40),
          reminderId: REMINDER,
          deviceId: id(31),
          status: 'pending',
          attempts: 1,
          nextAttemptAt: SCHEDULED,
        },
      ],
    });
    data.reminders[0]!.sentAt = SCHEDULED;
    data.profiles[0]!.consentConfirmed = false;
    const repository = createMemoryDeliveryRepository({ [fam(1)]: data });
    const { notifier, calls } = fakeNotifier();
    const result = await sendReminders(repository, notifier, { now: () => plus(61, SCHEDULED) });
    expect(calls).toHaveLength(0);
    expect(result.totals).toMatchObject({ expired: 1, revoked: 0 });
    expect(data.deliveries[0]).toMatchObject({ status: 'expired', attempts: 1 });
    expect(data.deliveries[0]?.lastError).toBeUndefined();
  });

  it('withFanOut của gia đình 1 lỗi → gia đình 2 vẫn xử lý; hàm không ném', async () => {
    const repository = createMemoryDeliveryRepository(
      { [fam(1)]: family(), [fam(2)]: family() },
      { failingFanOutFamilyId: fam(1) },
    );
    const result = await sendReminders(repository, fakeNotifier().notifier, { now: () => NOW });
    expect(result.failedFamilies).toBe(1);
    expect(result.failures).toEqual([{ familyId: fam(1), code: '42501' }]);
    expect(result.totals).toMatchObject({ fannedOut: 1, accepted: 2 });
    expect(result.aborted).toBe(false);
  });

  it('listFamilyIds lỗi → aborted: true, không ném', async () => {
    const repository = createMemoryDeliveryRepository({}, { listFails: true });
    const result = await sendReminders(repository, fakeNotifier().notifier, { now: () => NOW });
    expect(result.aborted).toBe(true);
    expect(result.failedFamilies).toBe(0);
    expect(result.failures).toEqual([]);
  });

  it('Dừng sau maxDeliveries đích trên toàn lượt (mọi gia đình)', async () => {
    const repository = createMemoryDeliveryRepository({ [fam(1)]: family(), [fam(2)]: family() });
    const { notifier, calls } = fakeNotifier();
    const result = await sendReminders(repository, notifier, { now: () => NOW, maxDeliveries: 3 });
    expect(calls).toHaveLength(3);
    expect(result.totals.accepted).toBe(3);
  });

  it('Gia đình lỗi giữa lúc gửi vẫn bị trừ ngân sách cho các đích đã xử lý', async () => {
    const repository = createMemoryDeliveryRepository(
      { [fam(1)]: family(), [fam(2)]: family() },
      { failDeliveryAfter: { familyId: fam(1), processed: 1 } },
    );
    const { notifier, calls } = fakeNotifier();
    const result = await sendReminders(repository, notifier, { now: () => NOW, maxDeliveries: 2 });
    expect(calls).toHaveLength(2);
    expect(result.totals.accepted).toBe(2);
    expect(result.failures).toEqual([{ familyId: fam(1), code: '57P01' }]);
  });
});
