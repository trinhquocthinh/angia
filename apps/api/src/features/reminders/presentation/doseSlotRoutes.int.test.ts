import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('API khung giờ buổi + RLS (SPEC-025)', () => {
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
      await t.call(main, 'POST', '/api/health-profiles', { birthYear: 1950, displayName: 'Mẹ' })
    ).json()) as HealthProfile;
    if (consent) await acceptConsentInvitation(t, main, profile.id);
    const path = `/api/health-profiles/${profile.id}/dose-slots`;
    const put = (slots: object) => t.call(main, 'PUT', path, { slots });
    const rows = async () =>
      (
        await t.owner.query(
          `SELECT slot, to_char(time_of_day, 'HH24:MI') AS time FROM dose_slots
           WHERE health_profile_id=$1 ORDER BY time_of_day`,
          [profile.id],
        )
      ).rows;
    return { familyId, main, profile, path, put, rows };
  };
  const motherSlots = { morning: '07:00', evening: '19:00' };

  it('TC-067: lưu Sáng 07:00, Tối 19:00 thành 02 khung giờ; GET trả cùng dữ liệu', async () => {
    const f = await fixture();
    expect(await (await t.call(f.main, 'GET', f.path)).json()).toEqual([]);
    const response = await f.put(motherSlots);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const expected = [
      { slot: 'morning', time: '07:00' },
      { slot: 'evening', time: '19:00' },
    ];
    expect(await response.json()).toEqual(expected);
    expect(await f.rows()).toEqual(expected);
    expect(await (await t.call(f.main, 'GET', f.path)).json()).toEqual(expected);
    expect(
      (await t.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0]
        .rolbypassrls,
    ).toBe(false);
  });
  it('TC-067: lưu lại thay toàn bộ cấu hình', async () => {
    const f = await fixture();
    await f.put(motherSlots);
    expect((await f.put({ noon: '11:30', afternoon: '17:00' })).status).toBe(200);
    expect(await f.rows()).toEqual([
      { slot: 'noon', time: '11:30' },
      { slot: 'afternoon', time: '17:00' },
    ]);
  });
  it('TC-068: Sáng 20:00 sau Tối 19:00 và giờ sai định dạng đều 422, không ghi', async () => {
    const f = await fixture();
    await f.put(motherSlots);
    const before = await f.rows();
    for (const slots of [
      { morning: '20:00', evening: '19:00' },
      { morning: '7:00' },
      { as_needed: '08:00' },
    ]) {
      const response = await f.put(slots);
      expect({ slots, status: response.status }).toEqual({ slots, status: 422 });
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect(await f.rows()).toEqual(before);
  });
  it('đồng thuận/main/CSRF/phiên được cưỡng chế', async () => {
    const f = await fixture(false);
    const response = await f.put(motherSlots);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    const member = await t.session(f.familyId, 'member');
    expect((await t.call(member, 'PUT', f.path, { slots: motherSlots })).status).toBe(403);
    expect((await t.call(member, 'GET', f.path)).status).toBe(403);
    const noCsrf = await t.app.request(f.path, {
      method: 'PUT',
      headers: { cookie: f.main.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ slots: motherSlots }),
    });
    expect(noCsrf.status).toBe(403);
    expect((await t.app.request(f.path, { method: 'PUT' })).status).toBe(401);
    expect(await f.rows()).toEqual([]);
  });
  it('GET/PUT chéo gia đình giống hồ sơ không tồn tại, không ghi', async () => {
    const f = await fixture();
    await f.put(motherSlots);
    const before = await f.rows();
    const foreign = await t.session(await t.family());
    const missing = `/api/health-profiles/${randomUUID()}/dose-slots`;
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'GET', f.path),
      () => t.call(foreign, 'GET', missing),
    );
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'PUT', f.path, { slots: { noon: '12:00' } }),
      () => t.call(foreign, 'PUT', missing, { slots: { noon: '12:00' } }),
    );
    expect(await f.rows()).toEqual(before);
  });
  it('hai lệnh lưu đồng thời được tuần tự hóa, không lỗi khóa chính', async () => {
    const f = await fixture();
    const responses = await Promise.all([f.put(motherSlots), f.put({ noon: '12:00' })]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect((await f.rows()).length).toBeGreaterThan(0);
  });
});
