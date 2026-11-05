import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vietnamDate } from '@src/shared/test/createFiniteCourse.js';
import { createRevisitFixture } from '@src/shared/test/createRevisitFixture.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('Đồng bộ nhắc khi sửa/xóa đơn (SPEC-043, Tech Spec 6.1.3)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  it('TC-474: còn đơn cùng ngày giữ nhắc; mất đơn cuối dọn nhắc chưa gửi và ledger, giữ đã gửi', async () => {
    const f = await createRevisitFixture(t);
    const first = await f.add('2026-11-20');
    const second = await f.add('2026-11-20');
    const unsent = await f.reminder('2026-11-20');
    const sent = await f.reminder('2026-11-20', true, 'same_day');
    expect((await f.put(first, '2026-11-25')).status).toBe(200);
    expect((await f.reminders()).map((r) => r.id).sort()).toEqual([unsent, sent].sort());
    expect((await f.put(second, null)).status).toBe(200);
    expect((await f.reminders()).map((r) => r.id)).toEqual([sent]);
    expect(
      (
        await t.owner.query('SELECT revisit_reminder_id FROM reminder_deliveries WHERE family_id=$1', [
          f.familyId,
        ])
      ).rows,
    ).toEqual([{ revisit_reminder_id: sent }]);
  });

  it.each([0, 2])(
    'TC-474: sinh ngay mốc hôm nay cho ngày D+%s lúc 06:00 VN, lặp không trùng',
    async (offset) => {
      const f = await createRevisitFixture(t);
      const id = await f.add(null);
      for (let i = 0; i < 2; i++) expect((await f.put(id, vietnamDate(offset))).status).toBe(200);
      expect(await f.reminders()).toEqual([
        expect.objectContaining({
          date: vietnamDate(offset),
          send_date: vietnamDate(0),
          offset_kind: offset === 0 ? 'same_day' : 'two_days_before',
          scheduled_at: new Date(`${vietnamDate(0)}T06:00:00+07:00`),
          sent_at: null,
        }),
      ]);
    },
  );

  it('TC-474: sửa ngày không có mốc hôm nay không sinh nhắc', async () => {
    const f = await createRevisitFixture(t);
    const id = await f.add(null);
    expect((await f.put(id, vietnamDate(1))).status).toBe(200);
    expect(await f.reminders()).toEqual([]);
  });

  it('TC-474: DELETE chứng từ chỉ dọn sau khi mất đơn cuối, giữ lịch sử đã gửi', async () => {
    const f = await createRevisitFixture(t);
    const doc = await seedPendingDocument(
      t,
      { familyId: f.familyId, accountId: f.main.accountId, profileId: f.profile.id },
      { type: 'prescription' },
    );
    await f.add('2026-11-20', '2026-01-01', doc.documentId);
    const other = await f.add('2026-11-20');
    const unsent = await f.reminder('2026-11-20');
    const sent = await f.reminder('2026-11-20', true, 'same_day');
    expect(
      (await t.call(f.main, 'DELETE', `/api/source-documents/${doc.documentId}`, { confirm: 'XÓA' })).status,
    ).toBe(204);
    expect(await f.reminders()).toHaveLength(2);
    expect((await f.put(other, null)).status).toBe(200);
    expect((await f.reminders()).map((r) => r.id)).toEqual([sent]);
    expect(
      (await t.owner.query('SELECT 1 FROM reminder_deliveries WHERE revisit_reminder_id=$1', [unsent]))
        .rowCount,
    ).toBe(0);
  });

  it('TC-474: DELETE chứng từ cuối dọn cả nhắc và ledger chưa gửi', async () => {
    const f = await createRevisitFixture(t);
    const doc = await seedPendingDocument(
      t,
      { familyId: f.familyId, accountId: f.main.accountId, profileId: f.profile.id },
      { type: 'prescription' },
    );
    await f.add('2026-11-20', '2026-01-01', doc.documentId);
    const unsent = await f.reminder('2026-11-20');
    const sent = await f.reminder('2026-11-20', true, 'same_day');
    expect(
      (await t.call(f.main, 'DELETE', `/api/source-documents/${doc.documentId}`, { confirm: 'XÓA' })).status,
    ).toBe(204);
    expect((await f.reminders()).map((r) => r.id)).toEqual([sent]);
    expect(
      (await t.owner.query('SELECT 1 FROM reminder_deliveries WHERE revisit_reminder_id=$1', [unsent]))
        .rowCount,
    ).toBe(0);
  });

  it('TC-474: hai sửa đồng thời chuyển hết đơn khỏi ngày cũ không để sót nhắc', async () => {
    const f = await createRevisitFixture(t);
    const first = await f.add('2026-11-20');
    const second = await f.add('2026-11-20');
    await f.reminder('2026-11-20');
    const responses = await Promise.all([f.put(first, '2026-11-25'), f.put(second, null)]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(await f.reminders()).toEqual([]);
  });
});
