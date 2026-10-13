import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('API giai đoạn dùng thuốc thực tế + RLS (SPEC-022)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const fixture = async (consent = true) => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = (await (
      await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Mẹ' })
    ).json()) as HealthProfile;
    if (consent) await acceptConsentInvitation(t, main, profile.id);
    const path = `/api/health-profiles/${profile.id}/adherence-periods`;
    const record = (body: object) => t.call(main, 'POST', path, body);
    const rows = async () =>
      (
        await t.owner.query(
          `SELECT medication_name, status, from_date::text, to_date::text, recorded_by
           FROM adherence_periods WHERE health_profile_id=$1 ORDER BY from_date`,
          [profile.id],
        )
      ).rows;
    return { familyId, main, profile, path, record, rows };
  };
  const amlodipin = { medicationName: 'Amlodipin', status: 'taking', fromDate: '2026-09-01' };

  it('TC-062: ghi "stopped" từ 10/10 đóng giai đoạn cũ vào 09/10 trong cùng giao dịch', async () => {
    const f = await fixture();
    expect((await f.record(amlodipin)).status).toBe(201);
    const response = await f.record({
      medicationName: ' amlodipin ',
      status: 'stopped',
      fromDate: '2026-10-10',
    });
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json();
    expect(body).toEqual({
      id: expect.any(String),
      healthProfileId: f.profile.id,
      medicationName: 'amlodipin',
      status: 'stopped',
      fromDate: '2026-10-10',
      toDate: null,
    });
    expect(await f.rows()).toEqual([
      {
        medication_name: 'Amlodipin',
        status: 'taking',
        from_date: '2026-09-01',
        to_date: '2026-10-09',
        recorded_by: f.main.accountId,
      },
      {
        medication_name: 'amlodipin',
        status: 'stopped',
        from_date: '2026-10-10',
        to_date: null,
        recorded_by: f.main.accountId,
      },
    ]);
    expect(
      (await t.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0]
        .rolbypassrls,
    ).toBe(false);
  });
  it('TC-063, TC-260, TC-261: mốc trước/trùng, trùng trạng thái, tương lai và body sai đều 422, không ghi', async () => {
    const f = await fixture();
    await f.record({ ...amlodipin, fromDate: '2026-10-10' });
    const before = await f.rows();
    for (const body of [
      { ...amlodipin, status: 'stopped', fromDate: '2026-10-05' },
      { ...amlodipin, status: 'stopped', fromDate: '2026-10-10' },
      { ...amlodipin, fromDate: '2026-10-11' },
      { ...amlodipin, medicationName: 'Metformin', fromDate: '2099-01-01' },
      { ...amlodipin, fromDate: '2026-02-30' },
      { ...amlodipin, toDate: '2026-10-20' },
      {},
    ]) {
      const response = await f.record(body);
      expect({ body, status: response.status }).toEqual({ body, status: 422 });
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect(await f.rows()).toEqual(before);
  });
  it('TC-262: GET trả giai đoạn theo thuốc rồi mốc tăng dần, không có trường nhận xét', async () => {
    const f = await fixture();
    await f.record({ ...amlodipin, medicationName: 'Metformin' });
    await f.record(amlodipin);
    await f.record({ ...amlodipin, status: 'stopped', fromDate: '2026-10-10' });
    const response = await t.call(f.main, 'GET', f.path);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = (await response.json()) as { today: string; periods: Record<string, unknown>[] };
    expect(body.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.periods.map((p) => [p.medicationName, p.status, p.fromDate, p.toDate])).toEqual([
      ['Amlodipin', 'taking', '2026-09-01', '2026-10-09'],
      ['Amlodipin', 'stopped', '2026-10-10', null],
      ['Metformin', 'taking', '2026-09-01', null],
    ]);
    expect(Object.keys(body.periods[0]!).sort()).toEqual([
      'fromDate',
      'healthProfileId',
      'id',
      'medicationName',
      'status',
      'toDate',
    ]);
  });
  it('TC-062: đồng thuận/main/CSRF/phiên được cưỡng chế', async () => {
    const f = await fixture(false);
    for (const response of [await f.record(amlodipin), await t.call(f.main, 'GET', f.path)]) {
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    }
    const member = await t.session(f.familyId, 'member');
    expect((await t.call(member, 'POST', f.path, amlodipin)).status).toBe(403);
    expect((await t.call(member, 'GET', f.path)).status).toBe(403);
    const noCsrf = await t.app.request(f.path, {
      method: 'POST',
      headers: { cookie: f.main.cookie, 'content-type': 'application/json' },
      body: JSON.stringify(amlodipin),
    });
    expect(noCsrf.status).toBe(403);
    expect((await t.app.request(f.path, { method: 'POST' })).status).toBe(401);
    expect(await f.rows()).toEqual([]);
  });
  it('TC-062: GET/POST chéo gia đình giống hồ sơ không tồn tại, không ghi', async () => {
    const f = await fixture();
    await f.record(amlodipin);
    const before = await f.rows();
    const foreign = await t.session(await t.family());
    const missing = `/api/health-profiles/${randomUUID()}/adherence-periods`;
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'GET', f.path),
      () => t.call(foreign, 'GET', missing),
    );
    const stop = { ...amlodipin, status: 'stopped', fromDate: '2026-10-10' };
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'POST', f.path, stop),
      () => t.call(foreign, 'POST', missing, stop),
    );
    expect(await f.rows()).toEqual(before);
  });
  it('TC-062: hai lệnh đồng thời cùng thuốc được tuần tự hóa, chỉ một giai đoạn mở', async () => {
    const f = await fixture();
    await f.record(amlodipin);
    const responses = await Promise.all([
      f.record({ ...amlodipin, status: 'stopped', fromDate: '2026-10-05' }),
      f.record({ ...amlodipin, status: 'stopped', fromDate: '2026-10-06' }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 422]);
    expect((await f.rows()).filter((r) => r.to_date === null)).toHaveLength(1);
  });
});
