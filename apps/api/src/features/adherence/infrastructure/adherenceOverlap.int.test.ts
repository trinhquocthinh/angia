import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

// BR-032: lớp chặn cuối ở DB, kể cả khi bỏ qua Application và chèn SQL trực tiếp.
describe('Exclusion constraint chống chồng lấn giai đoạn dùng thực tế (BR-032)', () => {
  let t: ProfileTestApp;
  let insert: (name: string, from: string, to: string | null) => Promise<unknown>;
  beforeAll(async () => {
    t = await startProfileTestApp();
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = (await (
      await t.call(main, 'POST', '/api/health-profiles', { birthYear: 1950, displayName: 'Mẹ' })
    ).json()) as HealthProfile;
    insert = (name, from, to) =>
      t.owner.query(
        `INSERT INTO adherence_periods (id, family_id, health_profile_id, medication_name,
           medication_name_normalized, status, from_date, to_date, recorded_by)
         VALUES ($1, $2, $3, $4, lower($4), 'taking', $5, $6, $7)`,
        [randomUUID(), familyId, profile.id, name, from, to, main.accountId],
      );
    await insert('Amlodipin', '2026-09-01', '2026-09-30');
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-089: chèn trực tiếp 15/09 → 10/10 bị PostgreSQL từ chối bởi exclusion constraint', async () => {
    await expect(insert('Amlodipin', '2026-09-15', '2026-10-10')).rejects.toMatchObject({
      code: '23P01',
      constraint: 'adherence_periods_no_overlap',
    });
  });
  it('TC-089: giai đoạn mở (to_date NULL) chồng lên giai đoạn đã đóng cũng bị từ chối', async () => {
    await expect(insert('Amlodipin', '2026-09-30', null)).rejects.toMatchObject({ code: '23P01' });
  });
  it('TC-089: liền kề ngày hôm sau và thuốc khác tên chuẩn hóa được phép', async () => {
    await expect(insert('Amlodipin', '2026-10-01', null)).resolves.toBeDefined();
    await expect(insert('Metformin', '2026-09-15', null)).resolves.toBeDefined();
  });
  it('TC-089: to_date trước from_date bị CHECK từ chối', async () => {
    await expect(insert('Losartan', '2026-09-15', '2026-09-14')).rejects.toMatchObject({
      code: '23514',
      constraint: 'adherence_periods_dates_valid',
    });
  });
});
