import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createStoppingFixture } from '@src/shared/test/createStoppingFixture.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
describe('API dừng đợt thuốc + RLS (SPEC-017)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-051: dừng đợt dài hạn, giữ hàm lượng/liều và loại khỏi danh sách chọn', async () => {
    const f = await createStoppingFixture(t);
    const response = await f.stop();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({
      id: f.course.id,
      status: 'stopped',
      endDate: '2026-10-04',
      strength: '500mg',
      quantityPerDose: 0.5,
    });
    expect(await (await t.call(f.main, 'GET', `${f.collection}/stoppable`)).json()).toMatchObject({
      courses: [],
    });
    expect(
      (await t.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0]
        .rolbypassrls,
    ).toBe(false);
  });
  it('TC-051: dừng cùng ngày bắt đầu được CHECK cho phép', async () => {
    const f = await createStoppingFixture(t);
    expect((await f.stop('2026-10-01')).status).toBe(200);
    expect(await f.rows()).toEqual([{ id: f.course.id, status: 'stopped', end_date: '2026-09-30' }]);
  });
  it('TC-051: đợt từ đơn hữu hạn không bị kéo dài; đọc đúng hàm lượng', async () => {
    const f = await createStoppingFixture(t, true, true);
    expect(f.course).toMatchObject({ source: 'prescription', strength: '500mg', endDate: '2026-10-07' });
    expect((await f.stop('2026-10-08')).status).toBe(422);
    expect((await f.stop('2026-10-07')).status).toBe(200);
    expect(await f.rows()).toEqual([{ id: f.course.id, status: 'stopped', end_date: '2026-10-06' }]);
  });
  it.each(['ended', 'stopped', 'replaced'])('TC-052: %s trả 409, không sửa ngày kết thúc', async (status) => {
    const f = await createStoppingFixture(t);
    await t.owner.query("UPDATE medication_courses SET status=$1,end_date='2026-10-07' WHERE id=$2", [
      status,
      f.course.id,
    ]);
    const before = await f.rows();
    const response = await f.stop();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_INVALID_STATE_TRANSITION' } });
    expect(await f.rows()).toEqual(before);
  });
  it('TC-051: ngày sai/trước bắt đầu/tương lai và trường ngoài hợp đồng không ghi', async () => {
    const f = await createStoppingFixture(t);
    const before = await f.rows();
    for (const body of [
      { stopDate: '2026-02-30' },
      { stopDate: '2026-09-30' },
      { stopDate: '2099-01-01' },
      { stopDate: '2026-10-05', status: 'stopped' },
      {},
    ]) {
      const response = await t.call(f.main, 'POST', f.stopPath, body);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect(await f.rows()).toEqual(before);
  });
  it('TC-051: đồng thuận/phiên/main/CSRF được cưỡng chế', async () => {
    const f = await createStoppingFixture(t, false);
    expect(await (await f.stop()).json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    expect((await t.call(f.main, 'GET', `${f.collection}/stoppable`)).status).toBe(409);
    const member = await t.session(f.familyId, 'member');
    expect((await t.call(member, 'POST', f.stopPath, { stopDate: '2026-10-05' })).status).toBe(403);
    expect((await t.call(member, 'GET', `${f.collection}/stoppable`)).status).toBe(403);
    expect(
      (
        await t.app.request(f.stopPath, {
          method: 'POST',
          headers: { cookie: f.main.cookie, 'content-type': 'application/json' },
          body: '{"stopDate":"2026-10-05"}',
        })
      ).status,
    ).toBe(403);
    expect((await t.app.request(f.stopPath, { method: 'POST' })).status).toBe(401);
    expect((await f.rows())[0].status).toBe('active');
  });
  it('TC-051: cả GET/POST chéo gia đình giống ID không tồn tại; ID đợt phải thuộc hồ sơ', async () => {
    const f = await createStoppingFixture(t);
    const foreign = await t.session(await t.family());
    const missingCollection = `/api/health-profiles/${randomUUID()}/medication-courses`;
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'GET', `${f.collection}/stoppable`),
      () => t.call(foreign, 'GET', `${missingCollection}/stoppable`),
    );
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'POST', f.stopPath, { stopDate: '2026-10-05' }),
      () => t.call(foreign, 'POST', `${missingCollection}/${randomUUID()}/stop`, { stopDate: '2026-10-05' }),
    );
    const otherProfile = (await (
      await t.call(f.main, 'POST', '/api/health-profiles', { displayName: 'Mẹ' })
    ).json()) as { id: string };
    // Đồng thuận hồ sơ thứ hai rồi thử ID đợt của hồ sơ thứ nhất.
    const { acceptConsentInvitation } = await import('@src/shared/test/acceptConsentInvitation.js');
    await acceptConsentInvitation(t, f.main, otherProfile.id);
    expect(
      (
        await t.call(
          f.main,
          'POST',
          `/api/health-profiles/${otherProfile.id}/medication-courses/${f.course.id}/stop`,
          { stopDate: '2026-10-05' },
        )
      ).status,
    ).toBe(404);
    expect((await f.rows())[0].status).toBe('active');
  });
  it('TC-051: danh sách chỉ có đợt active đã bắt đầu, gồm cả đợt active cần ghi hồi tố', async () => {
    const f = await createStoppingFixture(t, true, true);
    await t.call(f.main, 'POST', f.collection, {
      name: 'Vitamin',
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'],
      startDate: '2099-01-01',
    });
    const response = await t.call(f.main, 'GET', `${f.collection}/stoppable`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const data = (await response.json()) as { today: string; courses: { id: string }[] };
    expect(data.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.courses.map((c) => c.id)).toEqual([f.course.id]);
  });
});
