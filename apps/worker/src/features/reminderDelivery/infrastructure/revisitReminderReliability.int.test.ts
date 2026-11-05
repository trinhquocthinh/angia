import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { generateReminders } from '../../reminderGeneration/application/generateReminders.js';
import { createReminderRepository } from '../../reminderGeneration/infrastructure/createReminderRepository.js';
import { sendReminders } from '../application/sendReminders.js';
import { createDeliveryRepository } from './createDeliveryRepository.js';
import { fakeNotifier, plus } from './seedDeliveryFamily.test-helper.js';
import { REVISIT_NOW, seedRevisitFamily } from './revisitReminder.test-helper.js';

describe('Độ tin cậy nhắc tái khám (SPEC-044)', () => {
  let fx: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  beforeAll(async () => {
    fx = await createSanitizePgFixture();
  });
  afterAll(async () => fx?.close());

  it('TC-475: hai lượt sinh đồng thời chỉ tạo một nhắc và không đọc nhầm gia đình', async () => {
    const f = await seedRevisitFamily(fx.owner);
    const other = await seedRevisitFamily(fx.owner);
    await f.addPrescription();
    await other.addPrescription();
    const repo = {
      ...createReminderRepository(fx.pool, randomUUID),
      listFamilyIds: async () => [f.familyId],
    };
    const results = await Promise.all([
      generateReminders(repo, '2026-11-18'),
      generateReminders(repo, '2026-11-18'),
    ]);
    expect(results.map((r) => r.totals.created).sort()).toEqual([0, 1]);
    expect(results.every((r) => r.totals.failedFamilies === 0)).toBe(true);
    expect((await fx.owner.query('SELECT family_id FROM revisit_reminders')).rows).toEqual([
      { family_id: f.familyId },
    ]);
  });

  it('TC-475: sinh chờ khóa sửa đơn rồi đọc ngày mới, không tạo lại nhắc ngày cũ', async () => {
    const f = await seedRevisitFamily(fx.owner);
    await f.addPrescription();
    const editor = await fx.pool.connect();
    let pending: ReturnType<typeof generateReminders> | undefined;
    try {
      await editor.query('BEGIN');
      await editor.query("SELECT set_config('app.family_id',$1,true)", [f.familyId]);
      await editor.query('SELECT id FROM health_profiles WHERE id=$1 FOR SHARE', [f.profileId]);
      await editor.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
        `angia:medications:${f.familyId}:${f.profileId}`,
      ]);
      const repo = {
        ...createReminderRepository(fx.pool, randomUUID),
        listFamilyIds: async () => [f.familyId],
      };
      pending = generateReminders(repo, '2026-11-18');
      await expect
        .poll(
          async () =>
            (
              await fx.owner.query(
                "SELECT count(*)::int AS n FROM pg_locks WHERE locktype='advisory' AND NOT granted",
              )
            ).rows[0].n,
        )
        .toBe(1);
      await editor.query('UPDATE prescriptions SET revisit_date=NULL WHERE health_profile_id=$1', [
        f.profileId,
      ]);
      await editor.query('COMMIT');
      expect((await pending).totals).toMatchObject({ created: 0, failedFamilies: 0 });
    } finally {
      await editor.query('ROLLBACK');
      editor.release();
      await pending;
    }
  });

  it('TC-477: retry chỉ gửi lại đích còn chờ; gone xóa thiết bị và ledger quá cửa sổ thành expired', async () => {
    const f = await seedRevisitFamily(fx.owner);
    const good = await f.addDevice();
    const flaky = await f.addDevice();
    const gone = await f.addDevice();
    const id = await f.addRevisit();
    const fake = fakeNotifier((endpoint) =>
      endpoint === flaky.endpoint
        ? { kind: 'retry', code: 'http_5xx' }
        : endpoint === gone.endpoint
          ? { kind: 'gone' }
          : { kind: 'accepted' },
    );
    const repo = {
      ...createDeliveryRepository(fx.pool, randomUUID),
      listFamilyIds: async () => [f.familyId],
    };
    const run = (now: Date) => sendReminders(repo, fake.notifier, { now: () => now });
    expect((await run(REVISIT_NOW)).totals).toMatchObject({ accepted: 1, retried: 1, gone: 1 });
    expect((await f.rows(id)).find((r) => r.status === 'gone')).toMatchObject({ push_subscription_id: null });
    expect((await fx.owner.query('SELECT 1 FROM push_subscriptions WHERE id=$1', [gone.id])).rowCount).toBe(
      0,
    );
    await run(plus(REVISIT_NOW, 1));
    expect(fake.callsTo(good.endpoint)).toHaveLength(1);
    expect(fake.callsTo(flaky.endpoint)).toHaveLength(2);
    expect((await run(plus(REVISIT_NOW, 61))).totals.expired).toBe(1);
    expect((await f.rows(id)).find((r) => r.push_subscription_id === flaky.id)).toMatchObject({
      status: 'expired',
      attempts: 2,
    });
  });
});
