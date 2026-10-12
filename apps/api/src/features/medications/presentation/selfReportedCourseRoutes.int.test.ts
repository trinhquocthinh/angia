import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, MedicationCourse } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const body = {
  name: 'Canxi',
  strength: '500mg',
  quantityPerDose: 0.5,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
};
const path = (id: string) => `/api/health-profiles/${id}/medication-courses`;

describe('Khai báo thuốc bổ qua route thật + RLS (SPEC-016)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  async function fixture(consent = true) {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = (await (
      await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Bà ngoại' })
    ).json()) as HealthProfile;
    if (consent) await acceptConsentInvitation(t, main, profile.id);
    const save = (input: object = body) => t.call(main, 'POST', path(profile.id), input);
    const rows = async () =>
      (
        await t.owner.query(
          'SELECT id, status, end_date::text, strength FROM medication_courses WHERE health_profile_id=$1 ORDER BY id',
          [profile.id],
        )
      ).rows;
    return { familyId, main, profile, save, rows };
  }
  it('TC-049: 201 đợt dài hạn, lưu hàm lượng mà không tạo đơn', async () => {
    const f = await fixture();
    const response = await f.save();
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({
      healthProfileId: f.profile.id,
      source: 'self_reported',
      prescriptionItemId: null,
      strength: '500mg',
      quantityPerDose: 0.5,
      slots: ['morning'],
      startDate: '2026-10-01',
      endDate: null,
      status: 'active',
    });
    expect(await f.rows()).toEqual([expect.objectContaining({ strength: '500mg', end_date: null })]);
    expect(
      (await t.owner.query('SELECT id FROM prescriptions WHERE health_profile_id=$1', [f.profile.id])).rows,
    ).toEqual([]);
    expect(
      (await t.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0]
        .rolbypassrls,
    ).toBe(false);
  });
  it('TC-050: rỗng/thiếu buổi hoặc thiếu liều → 422 đúng mã, không ghi', async () => {
    const f = await fixture();
    const missing = { name: 'Canxi', doseUnit: 'viên', startDate: '2026-10-01' };
    for (const input of [{ ...body, slots: [] }, { ...body, quantityPerDose: null }, missing]) {
      const response = await f.save(input);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_DOSE_INFO_MISSING' } });
    }
    expect(await f.rows()).toEqual([]);
  });
  it('TC-049: nguồn/thời hạn tùy ý và ngày không tồn tại bị từ chối', async () => {
    const f = await fixture();
    // TC-248: thuốc bổ không nhận buổi "Khi cần".
    for (const extra of [
      { source: 'prescription' },
      { endDate: '2026-10-31' },
      { startDate: '2026-02-30' },
      { slots: ['as_needed'] },
    ])
      expect((await f.save({ ...body, ...extra })).status).toBe(422);
    expect(await f.rows()).toEqual([]);
  });
  it('TC-049: chưa đồng thuận → 409; member hoặc thiếu CSRF → 403; thiếu phiên → 401', async () => {
    const f = await fixture(false);
    expect(await (await f.save()).json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    const member = await t.session(f.familyId, 'member');
    expect((await t.call(member, 'POST', path(f.profile.id), body)).status).toBe(403);
    expect(
      (
        await t.app.request(path(f.profile.id), {
          method: 'POST',
          headers: {
            cookie: f.main.cookie,
            'content-type': 'application/json',
          },
          body: JSON.stringify(body),
        })
      ).status,
    ).toBe(403);
    expect((await t.app.request(path(f.profile.id), { method: 'POST' })).status).toBe(401);
    expect(await f.rows()).toEqual([]);
  });
  it('TC-049: khác gia đình nhận 404 giống ID không tồn tại', async () => {
    const f = await fixture();
    const foreign = await t.session(await t.family());
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'POST', path(f.profile.id), body),
      () => t.call(foreign, 'POST', path(randomUUID()), body),
    );
    expect(await f.rows()).toEqual([]);
  });
  it('TC-049: 409 hiển thị hàm lượng đợt tự khai báo; parallel giữ đợt cũ', async () => {
    const f = await fixture();
    const old = (await (await f.save()).json()) as MedicationCourse;
    const response = await f.save({ ...body, name: 'CANXI', strength: '1000mg' });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: {
        code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
        details: { conflicts: [{ itemIndexes: [0], courses: [{ id: old.id, strength: '500mg' }] }] },
      },
    });
    expect(
      (await f.save({ ...body, resolution: 'parallel', expectedConflictCourseIds: [old.id] })).status,
    ).toBe(201);
    expect((await f.rows()).map((c) => c.status)).toEqual(['active', 'active']);
    const stale = await f.save({ ...body, resolution: 'replace', expectedConflictCourseIds: [old.id] });
    expect(stale.status).toBe(409);
    expect(await f.rows()).toHaveLength(2);
    const ids = (await f.rows()).map((c) => c.id);
    expect((await f.save({ ...body, resolution: 'replace', expectedConflictCourseIds: ids })).status).toBe(
      201,
    );
    expect((await f.rows()).filter((c) => ids.includes(c.id))).toEqual(
      ids.map((id) => ({
        id,
        status: 'replaced',
        end_date: '2026-09-30',
        strength: '500mg',
      })),
    );
  });
  it('TC-049: lỗi ghi mới rollback cả thay thế', async () => {
    const f = await fixture();
    const old = (await (await f.save()).json()) as MedicationCourse;
    await t.owner.query(
      "ALTER TABLE medication_courses ADD CONSTRAINT test_supplement_failure CHECK (strength <> 'lỗi ghi') NOT VALID",
    );
    try {
      expect(
        (
          await f.save({
            ...body,
            strength: 'lỗi ghi',
            resolution: 'replace',
            expectedConflictCourseIds: [old.id],
          })
        ).status,
      ).toBe(500);
      expect(await f.rows()).toEqual([{ id: old.id, status: 'active', end_date: null, strength: '500mg' }]);
    } finally {
      await t.owner.query('ALTER TABLE medication_courses DROP CONSTRAINT test_supplement_failure');
    }
  });
  it('TC-049: hai lệnh thuốc bổ đồng thời → một lưu, một phải xác nhận', async () => {
    const f = await fixture();
    const responses = await Promise.all([f.save(), f.save()]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await f.rows()).toHaveLength(1);
  });
  it('TC-049: thuốc bổ và đơn thuốc đồng thời dùng chung khóa hồ sơ', async () => {
    const f = await fixture();
    const item = { ...body, durationDays: 30, longTerm: false, note: null, totalQuantity: null };
    const responses = await Promise.all([
      f.save(),
      t.call(f.main, 'POST', `/api/health-profiles/${f.profile.id}/manual-records`, {
        type: 'prescription',
        data: {
          type: 'prescription',
          issuedDate: body.startDate,
          facility: null,
          diagnosis: null,
          items: [item],
        },
      }),
    ]);
    const codes = responses.map((r) => r.status).sort();
    expect(codes[1]).toBe(409);
    expect([200, 201]).toContain(codes[0]);
    expect(await f.rows()).toHaveLength(1);
  });
  it('TC-049: toàn bộ đợt xung đột vừa bị thay thế phải xác nhận lại tập ID rỗng', async () => {
    const f = await fixture();
    const old = (await (await f.save()).json()) as MedicationCourse;
    await t.owner.query(
      "UPDATE medication_courses SET status='replaced', end_date='2026-09-30' WHERE id=$1",
      [old.id],
    );
    const response = await f.save({ ...body, resolution: 'replace', expectedConflictCourseIds: [old.id] });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { details: { conflicts: [{ courses: [] }] } } });
    expect(await f.rows()).toHaveLength(1);
    expect((await f.save({ ...body, resolution: 'replace', expectedConflictCourseIds: [] })).status).toBe(
      201,
    );
  });
});
