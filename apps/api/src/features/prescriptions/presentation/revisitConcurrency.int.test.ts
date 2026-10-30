import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setRevisitDate } from '../application/setRevisitDate.js';
import { createRevisitRepository } from '../infrastructure/createRevisitRepository.js';
import { createDeletionRepository } from '@src/features/documents/infrastructure/createDeletionRepository.js';
import { createRevisitFixture } from '@src/shared/test/createRevisitFixture.js';
import { holdDuplicateRecordLock } from '@src/shared/test/holdDuplicateRecordLock.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('Transaction và khóa lịch tái khám (SPEC-043)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  it('TC-474: PUT UUID hoa/thường và DELETE đều chờ khóa dùng chung với lưu đơn', async () => {
    const f = await createRevisitFixture(t);
    const doc = await seedPendingDocument(
      t,
      { familyId: f.familyId, accountId: f.main.accountId, profileId: f.profile.id },
      { type: 'prescription' },
    );
    await f.add('2026-11-20', '2026-01-01', doc.documentId);
    const other = await f.add('2026-11-20');
    await f.reminder('2026-11-20');
    const release = await holdDuplicateRecordLock(
      t,
      f.familyId,
      `angia:medications:${f.familyId}:${f.profile.id}`,
    );
    const calls = [
      t.call(
        f.main,
        'PUT',
        `${f.base.replace(f.profile.id, f.profile.id.toUpperCase())}/prescriptions/${other}/revisit-date`,
        { revisitDate: null },
      ),
      t.call(f.main, 'DELETE', `/api/source-documents/${doc.documentId}`, { confirm: 'XÓA' }),
    ];
    try {
      await expect
        .poll(
          async () =>
            (
              await t.owner.query(
                "SELECT count(*)::int AS n FROM pg_locks WHERE locktype='advisory' AND NOT granted",
              )
            ).rows[0].n,
          { timeout: 3000 },
        )
        .toBe(2);
    } finally {
      await release();
      await Promise.allSettled(calls);
    }
    expect((await Promise.all(calls)).map((r) => r.status)).toEqual([200, 204]);
    expect(await f.reminders()).toEqual([]);
  });

  it('TC-474: lỗi sau sửa rollback cả ngày hẹn, nhắc cũ, ledger và nhắc mới', async () => {
    const f = await createRevisitFixture(t);
    const id = await f.add('2026-11-20');
    const reminderId = await f.reminder('2026-11-20');
    const repository = createRevisitRepository(t.database);
    await expect(
      setRevisitDate(
        {
          withFamily: (familyId, work) =>
            repository.withFamily(familyId, async (store) => {
              await work(store);
              throw new Error('Lỗi sau sửa');
            }),
        },
        { familyId: f.familyId, profileId: f.profile.id, prescriptionId: id, revisitDate: '2026-10-30' },
        () => new Date('2026-10-30T00:00:00Z'),
      ),
    ).rejects.toThrow('Lỗi sau sửa');
    expect(
      (await t.owner.query('SELECT revisit_date::text FROM prescriptions WHERE id=$1', [id])).rows,
    ).toEqual([{ revisit_date: '2026-11-20' }]);
    expect((await f.reminders()).map((r) => r.id)).toEqual([reminderId]);
    expect(
      (await t.owner.query('SELECT 1 FROM reminder_deliveries WHERE revisit_reminder_id=$1', [reminderId]))
        .rowCount,
    ).toBe(1);
  });

  it('TC-474: rollback DELETE khôi phục chứng từ, đơn, nhắc và ledger', async () => {
    const f = await createRevisitFixture(t);
    const doc = await seedPendingDocument(
      t,
      { familyId: f.familyId, accountId: f.main.accountId, profileId: f.profile.id },
      { type: 'prescription' },
    );
    const id = await f.add('2026-11-20', '2026-01-01', doc.documentId);
    const reminderId = await f.reminder('2026-11-20');
    await expect(
      createDeletionRepository(t.database).withFamily(f.familyId, async (store) => {
        await store.findDocument(doc.documentId, true);
        await store.deleteDocument(doc.documentId);
        throw new Error('Lỗi sau xóa');
      }),
    ).rejects.toThrow('Lỗi sau xóa');
    expect((await t.owner.query('SELECT 1 FROM prescriptions WHERE id=$1', [id])).rowCount).toBe(1);
    expect((await f.reminders()).map((r) => r.id)).toEqual([reminderId]);
    expect(
      (await t.owner.query('SELECT 1 FROM reminder_deliveries WHERE revisit_reminder_id=$1', [reminderId]))
        .rowCount,
    ).toBe(1);
  });
});
