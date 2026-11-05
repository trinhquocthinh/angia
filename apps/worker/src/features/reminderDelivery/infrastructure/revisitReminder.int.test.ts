import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { generateReminders } from '../../reminderGeneration/application/generateReminders.js';
import { createReminderRepository } from '../../reminderGeneration/infrastructure/createReminderRepository.js';
import { sendReminders } from '../application/sendReminders.js';
import { createDeliveryRepository } from './createDeliveryRepository.js';
import { createReminderNotifier } from './createReminderNotifier.js';
import { REVISIT_DATE, REVISIT_NOW, seedRevisitFamily } from './revisitReminder.test-helper.js';

describe('Sinh và gửi nhắc tái khám (SPEC-044)', () => {
  let fx: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  beforeAll(async () => {
    fx = await createSanitizePgFixture();
  });
  afterAll(async () => fx?.close());
  const run = async (familyId: string, maxDeliveries = 500, now = REVISIT_NOW) => {
    const calls: unknown[][] = [];
    const notifier = createReminderNotifier({
      send: async (...args) => {
        calls.push(args);
        return { kind: 'accepted' };
      },
    });
    const repository = {
      ...createDeliveryRepository(fx.pool, randomUUID),
      listFamilyIds: async () => [familyId],
    };
    const result = await sendReminders(repository, notifier, { now: () => now, maxDeliveries });
    return { result, calls };
  };

  it('TC-475: gộp nhiều đơn, hai mốc đúng 06:00 VN, chạy lại không trùng và không cần người nhận nhắc thuốc', async () => {
    const f = await seedRevisitFamily(fx.owner);
    await f.addPrescription();
    await f.addPrescription();
    await f.addPrescription(null);
    await f.addPrescription('2026-11-19');
    await fx.owner.query('DELETE FROM reminder_recipients WHERE family_id=$1', [f.familyId]);
    const repository = {
      ...createReminderRepository(fx.pool, randomUUID),
      listFamilyIds: async () => [f.familyId],
    };
    for (const date of ['2026-11-18', REVISIT_DATE]) {
      expect((await generateReminders(repository, date)).totals).toMatchObject({
        created: 1,
        failedFamilies: 0,
      });
      expect((await generateReminders(repository, date)).totals).toMatchObject({ created: 0, existing: 1 });
    }
    const rows = await withFamilyScope(
      fx.pool,
      f.familyId,
      async (c) =>
        (
          await c.query(`SELECT revisit_date::text,
      send_date::text, offset_kind, scheduled_at FROM revisit_reminders ORDER BY send_date`)
        ).rows,
    );
    expect(rows).toEqual([
      {
        revisit_date: REVISIT_DATE,
        send_date: '2026-11-18',
        offset_kind: 'two_days_before',
        scheduled_at: REVISIT_NOW,
      },
      {
        revisit_date: REVISIT_DATE,
        send_date: REVISIT_DATE,
        offset_kind: 'same_day',
        scheduled_at: new Date('2026-11-19T23:00:00Z'),
      },
    ]);
    expect((await fx.pool.query('SELECT * FROM revisit_reminders')).rowCount).toBe(0);
  });

  it('TC-476: pending/withdrawn không sinh; ledger đã fan-out trước rút đồng thuận chuyển revoked_consent', async () => {
    const f = await seedRevisitFamily(fx.owner);
    await f.addDevice();
    await f.addPrescription();
    const id = await f.addRevisit();
    await run(f.familyId, 0);
    expect(await f.rows(id)).toHaveLength(1);
    await fx.owner.query(
      `UPDATE health_profiles SET consent_status='withdrawn', consent_withdrawn_at=now() WHERE id=$1`,
      [f.profileId],
    );
    expect((await run(f.familyId)).calls).toEqual([]);
    expect(await f.rows(id)).toMatchObject([
      { status: 'revoked', last_error: 'revoked_consent', attempts: 0 },
    ]);
    await fx.owner.query('DELETE FROM revisit_reminders WHERE family_id=$1', [f.familyId]);
    const repository = {
      ...createReminderRepository(fx.pool, randomUUID),
      listFamilyIds: async () => [f.familyId],
    };
    expect((await generateReminders(repository, '2026-11-18')).totals.created).toBe(0);
    await fx.owner.query(
      `UPDATE health_profiles SET consent_status='pending', consent_source=NULL,
      consent_confirmed_at=NULL, consent_basis=NULL, consent_respondent_name=NULL, consent_withdrawn_at=NULL WHERE id=$1`,
      [f.profileId],
    );
    expect((await generateReminders(repository, '2026-11-18')).totals.created).toBe(0);
  });

  it('TC-477: hai main và member liên kết nhận đúng payload, bỏ member khác và giữ quy tắc nhắc thuốc', async () => {
    const f = await seedRevisitFamily(fx.owner);
    const main2 = await f.addAccount('main');
    const linked = await f.addAccount('member', true);
    const other = await f.addAccount('member');
    const devices = [];
    for (const accountId of [f.mainId, main2, linked, other]) devices.push(await f.addDevice(accountId));
    const id = await f.addRevisit();
    const medication = await f.addReminder(REVISIT_NOW);
    const { result, calls } = await run(f.familyId);
    expect(result.failures).toEqual([]);
    expect(result.totals.accepted).toBe(4);
    expect(await f.rows(id)).toHaveLength(3);
    expect((await f.rows(id)).every((r) => r.reminder_id === null && r.status === 'accepted')).toBe(true);
    const revisitCalls = calls.filter((c) => (c[1] as { type: string }).type === 'revisit-reminder');
    expect(revisitCalls.map((c) => (c[0] as { endpoint: string }).endpoint).sort()).toEqual(
      devices
        .slice(0, 3)
        .map((d) => d.endpoint)
        .sort(),
    );
    expect(
      revisitCalls.every(
        (c) => JSON.stringify(c[1]) === JSON.stringify({ type: 'revisit-reminder', reminderId: id }),
      ),
    ).toBe(true);
    expect(calls.filter((c) => (c[1] as { reminderId: string }).reminderId === medication)).toMatchObject([
      [
        { endpoint: devices[2]!.endpoint },
        { type: 'medication-reminder', reminderId: medication },
        { ttlSeconds: 3600, urgency: 'high' },
      ],
    ]);
    expect((await run(f.familyId)).calls).toEqual([]);
  });

  it('TC-477: chốt thiết bị khi fan-out, bỏ người mất quyền trước gửi và dùng chung ngân sách hai loại', async () => {
    const f = await seedRevisitFamily(fx.owner);
    const main2 = await f.addAccount('main');
    await f.addDevice();
    const removed = await f.addDevice(main2);
    const id = await f.addRevisit();
    await f.addReminder(REVISIT_NOW);
    await run(f.familyId, 0);
    await fx.owner.query(`UPDATE accounts SET family_role='member' WHERE id=$1`, [main2]);
    const lateDevice = await f.addDevice();
    const first = await run(f.familyId, 1);
    expect(first.result.totals.accepted + first.result.totals.revoked).toBe(1);
    const next = await run(f.familyId);
    expect(
      [...first.calls, ...next.calls].some(
        (c) => (c[0] as { endpoint: string }).endpoint === lateDevice.endpoint,
      ),
    ).toBe(false);
    expect((await f.rows(id)).find((r) => r.push_subscription_id === removed.id)).toMatchObject({
      status: 'revoked',
      last_error: 'revoked_recipient',
    });
  });

  it('TC-477: quá cửa sổ 60 phút không tạo đích tái khám', async () => {
    const f = await seedRevisitFamily(fx.owner);
    await f.addDevice();
    const id = await f.addRevisit(new Date(REVISIT_NOW.getTime() - 61 * 60_000));
    expect((await run(f.familyId)).result.expiredBeforeFanoutReminderIds).toEqual([id]);
    expect(await f.rows(id)).toEqual([]);
  });
});
