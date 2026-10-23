import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { sendReminders } from '../application/sendReminders.js';
import type { DeliveryRepository } from '../application/ports.js';
import { createDeliveryRepository } from './createDeliveryRepository.js';
import {
  DRUG_NAME,
  deliveriesOf,
  fakeNotifier,
  hashOf,
  plus,
  seedDeliveryFamily,
  sentAtOf,
} from './seedDeliveryFamily.test-helper.js';

const T0 = new Date('2026-10-23T00:00:00.000Z');

describe('Gửi lời nhắc theo thiết bị trên PostgreSQL thật, role app NOBYPASSRLS (SPEC-027)', () => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  let repository: DeliveryRepository;
  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
    repository = createDeliveryRepository(fx.pool, randomUUID);
  });
  afterAll(async () => {
    await fx?.close();
  });
  // Giới hạn lượt vào một gia đình để dữ liệu của test khác cùng container không xen vào.
  const onlyFamily = (familyId: string): DeliveryRepository => ({
    ...repository,
    listFamilyIds: async () => [familyId],
  });
  const run = (familyId: string, notifier: Parameters<typeof sendReminders>[1], now: Date) =>
    sendReminders(onlyFamily(familyId), notifier, { now: () => now });

  it('TC-091: A accepted, B retry → lượt sau chỉ gửi B; A không gửi lại; không có cờ "đã đọc"', async () => {
    const f = await seedDeliveryFamily(fx.owner);
    const [a, b] = [await f.addDevice(), await f.addDevice()];
    const reminderId = await f.addReminder(T0);
    let bOutcome: 'network' | 'accepted' = 'network';
    const fake = fakeNotifier((endpoint) =>
      endpoint === b.endpoint && bOutcome === 'network'
        ? { kind: 'retry', code: 'network' }
        : { kind: 'accepted' },
    );

    const first = await run(f.familyId, fake.notifier, T0);
    expect(first.totals).toMatchObject({ fannedOut: 1, accepted: 1, retried: 1 });
    expect(await sentAtOf(fx.owner, reminderId)).toEqual(T0);
    const afterFirst = await deliveriesOf(fx.owner, reminderId);
    const rowOf = (rows: typeof afterFirst, id: string) => rows.find((r) => r.push_subscription_id === id);
    expect(rowOf(afterFirst, a.id)).toMatchObject({ status: 'accepted', attempts: 1, accepted_at: T0 });
    expect(rowOf(afterFirst, b.id)).toMatchObject({
      status: 'pending',
      attempts: 1,
      next_attempt_at: plus(T0, 1),
      last_error: 'network',
    });

    bOutcome = 'accepted';
    const second = await run(f.familyId, fake.notifier, plus(T0, 1));
    expect(second.totals).toMatchObject({ fannedOut: 0, accepted: 1 });
    expect(rowOf(await deliveriesOf(fx.owner, reminderId), b.id)).toMatchObject({
      status: 'accepted',
      attempts: 2,
      accepted_at: plus(T0, 1),
    });
    expect(fake.callsTo(a.endpoint)).toHaveLength(1);
    expect(fake.callsTo(b.endpoint)).toHaveLength(2);
    expect(fake.calls.every((c) => c.reminderId === reminderId)).toBe(true);
    expect(await sentAtOf(fx.owner, reminderId)).toEqual(T0);
    const columns = await fx.owner.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'reminder_deliveries'`,
    );
    expect(columns.rows.map((c) => c.column_name).filter((c) => /read|seen|display|taken/.test(c))).toEqual(
      [],
    );
  });

  it('TC-347a: gone xóa đúng id + endpoint_hash; endpoint đổi trong lúc gửi thì không xóa', async () => {
    const f = await seedDeliveryFamily(fx.owner);
    const [a, b] = [await f.addDevice(), await f.addDevice()];
    const reminderId = await f.addReminder(T0);
    const renewed = `https://push.example/renewed-${randomUUID()}`;
    // Hash dùng cho DELETE là hash đọc lúc khóa dòng ledger. Mô phỏng trình duyệt gia hạn endpoint của A
    // trong lúc HTTP đang chạy: notifier giả cập nhật endpoint/endpoint_hash bằng owner trước khi trả gone.
    const fake = fakeNotifier(
      () => ({ kind: 'gone' }),
      async (endpoint) => {
        if (endpoint !== a.endpoint) return;
        await fx.owner.query('UPDATE push_subscriptions SET endpoint=$2, endpoint_hash=$3 WHERE id=$1', [
          a.id,
          renewed,
          hashOf(renewed),
        ]);
      },
    );

    const result = await run(f.familyId, fake.notifier, T0);
    expect(result.totals.gone).toBe(2);
    const devices = await fx.owner.query<{ id: string; endpoint: string }>(
      'SELECT id, endpoint FROM push_subscriptions WHERE family_id=$1',
      [f.familyId],
    );
    expect(devices.rows.map((d) => d.id)).not.toContain(b.id);
    expect(devices.rows).toEqual([{ id: a.id, endpoint: renewed }]);
    const rows = await deliveriesOf(fx.owner, reminderId);
    expect(rows.map((r) => r.status)).toEqual(['gone', 'gone']);
    expect(rows.find((r) => r.push_subscription_id === a.id)).toMatchObject({ last_error: 'http_410' });
    expect(rows.filter((r) => r.push_subscription_id === null)).toHaveLength(1);
  });

  it('TC-347b: 429 Retry-After 300 → +5′; 5xx sáu lần liên tiếp → failed, attempts 6', async () => {
    const f = await seedDeliveryFamily(fx.owner);
    const limited = await f.addDevice();
    const flaky = await f.addDevice();
    const reminderId = await f.addReminder(T0);
    const fake = fakeNotifier((endpoint) =>
      endpoint === limited.endpoint
        ? { kind: 'retry', code: 'http_429', retryAfterSeconds: 300 }
        : { kind: 'retry', code: 'http_5xx' },
    );

    await run(f.familyId, fake.notifier, T0);
    const rowOf = async (id: string) =>
      (await deliveriesOf(fx.owner, reminderId)).find((r) => r.push_subscription_id === id)!;
    expect(await rowOf(limited.id)).toMatchObject({
      status: 'pending',
      attempts: 1,
      next_attempt_at: plus(T0, 5),
      last_error: 'http_429',
    });
    for (let round = 1; round < 6; round += 1) {
      const next = (await rowOf(flaky.id)).next_attempt_at!;
      await run(f.familyId, fake.notifier, next);
    }
    expect(await rowOf(flaky.id)).toMatchObject({ status: 'failed', attempts: 6, last_error: 'http_5xx' });
    expect(fake.callsTo(flaky.endpoint)).toHaveLength(6);
  });

  it('TC-347c: quá 60′ chưa fan-out → sent_at, 0 đích; đích pending quá cửa sổ lúc xử lý → expired', async () => {
    const f = await seedDeliveryFamily(fx.owner);
    const device = await f.addDevice();
    const stale = await f.addReminder(plus(T0, -61), 'morning');
    const fake = fakeNotifier(() => ({ kind: 'retry', code: 'timeout' }));

    const result = await run(f.familyId, fake.notifier, T0);
    expect(result.expiredBeforeFanoutReminderIds).toEqual([stale]);
    expect(await sentAtOf(fx.owner, stale)).toEqual(T0);
    expect(await deliveriesOf(fx.owner, stale)).toEqual([]);

    const fresh = await f.addReminder(T0, 'noon');
    await run(f.familyId, fake.notifier, T0);
    expect((await deliveriesOf(fx.owner, fresh))[0]).toMatchObject({ status: 'pending', attempts: 1 });
    const late = await run(f.familyId, fake.notifier, plus(T0, 61));
    expect(late.totals.expired).toBe(1);
    expect((await deliveriesOf(fx.owner, fresh))[0]).toMatchObject({ status: 'expired', attempts: 1 });
    expect(fake.callsTo(device.endpoint)).toHaveLength(1);
  });

  it('TC-347d: gỡ người nhận → revoked_recipient; gỡ thiết bị → revoked_device; thiết bị mới không nhận', async () => {
    const recipientCase = await seedDeliveryFamily(fx.owner);
    await recipientCase.addDevice();
    const r1 = await recipientCase.addReminder(T0);
    const deviceCase = await seedDeliveryFamily(fx.owner);
    const removed = await deviceCase.addDevice();
    const r2 = await deviceCase.addReminder(T0);
    const fake = fakeNotifier();
    // Fan-out trước (gửi chưa đến hạn vì ngân sách 0), sau đó đổi dữ liệu rồi mới gửi.
    for (const familyId of [recipientCase.familyId, deviceCase.familyId])
      await sendReminders(onlyFamily(familyId), fake.notifier, { now: () => T0, maxDeliveries: 0 });
    await fx.owner.query('DELETE FROM reminder_recipients WHERE health_profile_id=$1', [
      recipientCase.profileId,
    ]);
    await fx.owner.query('DELETE FROM push_subscriptions WHERE id=$1', [removed.id]);
    const added = await deviceCase.addDevice();

    for (const familyId of [recipientCase.familyId, deviceCase.familyId])
      await run(familyId, fake.notifier, T0);
    expect(await deliveriesOf(fx.owner, r1)).toMatchObject([
      { status: 'revoked', last_error: 'revoked_recipient', attempts: 0 },
    ]);
    expect(await deliveriesOf(fx.owner, r2)).toMatchObject([
      { status: 'revoked', last_error: 'revoked_device', push_subscription_id: null },
    ]);
    expect(fake.callsTo(added.endpoint)).toHaveLength(0);
    expect(fake.calls).toHaveLength(0);
  });

  it('NFR-4: RLS tách gia đình; kết quả job không chứa tên thuốc', async () => {
    const one = await seedDeliveryFamily(fx.owner);
    const two = await seedDeliveryFamily(fx.owner);
    await one.addDevice();
    await two.addDevice();
    // Lượt thật trên mọi gia đình, mốc giờ sau mọi test khác nên dữ liệu cũ chỉ còn expired.
    const later = plus(T0, 2 * 24 * 60);
    await one.addReminder(later);
    await two.addReminder(later);
    const fake = fakeNotifier(() => ({ kind: 'retry', code: 'http_5xx' }));
    // listFamilyIds của repository (families không áp RLS) phải thấy cả hai gia đình.
    const result = await sendReminders(repository, fake.notifier, { now: () => later });
    expect(result.aborted).toBe(false);
    expect(result.failures).toEqual([]);
    expect(result.totals.fannedOut).toBe(2);
    expect(JSON.stringify(result)).not.toContain(DRUG_NAME);

    for (const scoped of [
      `SELECT DISTINCT family_id FROM reminder_deliveries`,
      `SELECT DISTINCT family_id FROM reminders`,
      `SELECT DISTINCT family_id FROM push_subscriptions`,
    ]) {
      const rows = await withFamilyScope(fx.pool, one.familyId, async (c) => (await c.query(scoped)).rows);
      expect(rows).toEqual([{ family_id: one.familyId }]);
    }
    const unscoped = await fx.pool.query('SELECT 1 FROM reminder_deliveries');
    expect(unscoped.rowCount).toBe(0);
    const pending = await repository.processNextDelivery(
      one.familyId,
      () => plus(later, 1),
      async (candidate) => {
        expect(candidate.profileId).toBe(one.profileId);
        return { status: 'revoked', attempts: candidate.attempts, lastError: 'revoked_device' };
      },
    );
    expect(pending).not.toBeNull();
  });
});
