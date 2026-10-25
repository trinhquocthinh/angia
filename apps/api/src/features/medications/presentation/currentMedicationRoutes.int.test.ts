import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { CurrentMedications } from '@angia/contracts';
import { createStoppingFixture } from '@src/shared/test/createStoppingFixture.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
const prescription = (name: string, durationDays: number | null) => ({
  type: 'prescription',
  data: {
    type: 'prescription',
    issuedDate: '2026-10-01',
    facility: null,
    diagnosis: null,
    items: [
      {
        name,
        strength: '5mg',
        quantityPerDose: 1,
        doseUnit: 'viên',
        slots: ['morning', 'evening'],
        durationDays,
        longTerm: durationDays === null,
        note: null,
        totalQuantity: null,
      },
    ],
  },
});
describe('API danh mục thuốc đang dùng + RLS (SPEC-018, E4-S4-T1)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-238: chỉ đợt có hiệu lực hôm nay; kèm ngày kê đơn nguồn và hàm lượng', async () => {
    // Canxi từ đơn 7 ngày, dời về 01/10–07/10 cho đã qua kỳ hạn; các đợt dưới đây bắt đầu 01/10.
    const f = await createStoppingFixture(t, true, true);
    await t.owner.query(
      "UPDATE medication_courses SET start_date='2026-10-01', end_date='2026-10-07' WHERE id=$1",
      [f.course.id],
    );
    const manual = `/api/health-profiles/${f.profile.id}/manual-records`;
    expect((await t.call(f.main, 'POST', manual, prescription('Amlodipin', null))).status).toBe(200);
    for (const [name, startDate] of [
      ['Vitamin D', '2026-10-01'],
      ['Omega 3', '2099-01-01'],
    ])
      expect(
        (
          await t.call(f.main, 'POST', f.collection, {
            name,
            quantityPerDose: 1,
            doseUnit: 'viên',
            slots: ['noon'],
            startDate,
          })
        ).status,
      ).toBe(201);
    const response = await t.call(f.main, 'GET', `${f.collection}/current`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const data = (await response.json()) as CurrentMedications;
    expect(data.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.courses.map((course) => course.name).sort()).toEqual(['Amlodipin', 'Vitamin D']);
    expect(data.courses.find((course) => course.name === 'Amlodipin')).toMatchObject({
      source: 'prescription',
      strength: '5mg',
      endDate: null,
      slots: ['morning', 'evening'],
      prescriptionIssuedDate: '2026-10-01',
    });
    expect(data.courses.find((course) => course.name === 'Vitamin D')).toMatchObject({
      source: 'self_reported',
      prescriptionIssuedDate: null,
    });
    expect(
      (await t.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0]
        .rolbypassrls,
    ).toBe(false);
  });
  it('TC-238: đợt đã dừng trước hôm nay không còn trong danh mục', async () => {
    const f = await createStoppingFixture(t);
    expect((await f.stop('2026-10-05')).status).toBe(200);
    const data = (await (
      await t.call(f.main, 'GET', `${f.collection}/current`)
    ).json()) as CurrentMedications;
    expect(data.courses).toEqual([]);
  });
  it('TC-238: đồng thuận/phiên/main được cưỡng chế; chéo gia đình giống ID không tồn tại', async () => {
    const f = await createStoppingFixture(t, false);
    expect(await (await t.call(f.main, 'GET', `${f.collection}/current`)).json()).toMatchObject({
      error: { code: 'ERR_CONSENT_REQUIRED' },
    });
    const member = await t.session(f.familyId, 'member');
    expect((await t.call(member, 'GET', `${f.collection}/current`)).status).toBe(403);
    expect((await t.app.request(`${f.collection}/current`)).status).toBe(401);
    const consented = await createStoppingFixture(t);
    const foreign = await t.session(await t.family());
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'GET', `${consented.collection}/current`),
      () => t.call(foreign, 'GET', `/api/health-profiles/${randomUUID()}/medication-courses/current`),
    );
  });
});
