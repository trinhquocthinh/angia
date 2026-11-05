import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const base = '/api/health-profiles';

describe('Sửa hồ sơ: route thật, phân quyền và phạm vi gia đình', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  const create = async (main: SeededSession, extra: object = {}) => {
    const response = await t.call(main, 'POST', base, { displayName: 'Bé An', birthYear: 2020, ...extra });
    expect(response.status).toBe(201);
    return (await response.json()) as HealthProfile;
  };
  const row = async (id: string) =>
    (await t.owner.query('SELECT * FROM health_profiles WHERE id = $1', [id])).rows[0];

  it('TC-444: main sửa, bỏ qua trường ngoài hợp đồng, giữ metadata và lưu false thành NULL', async () => {
    const main = await t.session(await t.family());
    const profile = await create(main);
    const before = await row(profile.id);
    const path = `${base}/${profile.id}`;
    const enabled = await t.call(main, 'PATCH', path, {
      birthYear: 2021,
      vitalsEnabled: true,
      displayName: 'Tên khác',
      consentStatus: 'confirmed',
      linkedAccountId: main.accountId,
      familyId: randomUUID(),
    });
    expect(enabled.status).toBe(200);
    expect(enabled.headers.get('cache-control')).toBe('no-store');
    expect(await enabled.json()).toEqual({ ...profile, birthYear: 2021, vitalsEnabled: true });
    const yearOnly = await t.call(main, 'PATCH', path, { birthYear: 1980 });
    expect(yearOnly.status).toBe(200);
    expect(await yearOnly.json()).toEqual({ ...profile, birthYear: 1980, vitalsEnabled: true });
    const disabled = await t.call(main, 'PATCH', path, { vitalsEnabled: false });
    expect(disabled.status).toBe(200);
    expect(await disabled.json()).toEqual({ ...profile, birthYear: 1980, vitalsEnabled: null });
    expect(await row(profile.id)).toEqual({ ...before, birth_year: 1980, vitals_enabled: null });
    expect(
      (await t.owner.query('SELECT health_profile_id FROM accounts WHERE id=$1', [main.accountId])).rows[0]
        .health_profile_id,
    ).toBeNull();
  });

  it('TC-444: bổ sung năm sinh hồ sơ cũ giữ nguyên receipt và liên kết tài khoản', async () => {
    const main = await t.session(await t.family());
    const profile = await create(main, { linkedAccountId: main.accountId, consent: { kind: 'self' } });
    await t.owner.query('UPDATE health_profiles SET birth_year = NULL WHERE id = $1', [profile.id]);
    const before = await row(profile.id);
    const response = await t.call(main, 'PATCH', `${base}/${profile.id}`, {
      birthYear: 2020,
      vitalsEnabled: true,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...profile, vitalsEnabled: true });
    expect(await row(profile.id)).toEqual({ ...before, birth_year: 2020, vitals_enabled: true });
    expect(
      (await t.owner.query('SELECT health_profile_id FROM accounts WHERE id=$1', [main.accountId])).rows[0]
        .health_profile_id,
    ).toBe(profile.id);
  });

  it('TC-444: member bị chặn kể cả có quyền quản trị hệ thống', async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = await create(main);
    const before = await row(profile.id);
    for (const admin of [false, true]) {
      const member = await t.session(familyId, 'member', 'Thành viên', admin);
      expect((await t.call(member, 'PATCH', `${base}/${profile.id}`, { vitalsEnabled: true })).status).toBe(
        403,
      );
    }
    expect(await row(profile.id)).toEqual(before);
  });

  it('TC-444: thiếu hoặc sai CSRF bị chặn, chưa đăng nhập trả 401', async () => {
    const main = await t.session(await t.family());
    const profile = await create(main);
    const before = await row(profile.id);
    for (const token of [undefined, 'sai-token']) {
      const response = await t.app.request(`${base}/${profile.id}`, {
        method: 'PATCH',
        headers: {
          cookie: main.cookie,
          'content-type': 'application/json',
          ...(token === undefined ? {} : { 'x-csrf-token': token }),
        },
        body: JSON.stringify({ vitalsEnabled: true }),
      });
      expect(response.status).toBe(403);
    }
    expect((await t.app.request(`${base}/${profile.id}`, { method: 'PATCH' })).status).toBe(401);
    expect(await row(profile.id)).toEqual(before);
  });

  it('TC-444: chéo gia đình và ID thiếu cùng trả 404, không đổi dữ liệu nạn nhân', async () => {
    const victim = await t.session(await t.family());
    const attacker = await t.session(await t.family());
    const profile = await create(victim);
    const before = await row(profile.id);
    await expectCrossFamilyDenied(
      () => t.call(attacker, 'PATCH', `${base}/${profile.id}`, { vitalsEnabled: true }),
      () => t.call(attacker, 'PATCH', `${base}/${randomUUID()}`, { vitalsEnabled: true }),
    );
    expect(await row(profile.id)).toEqual(before);
    const missing = await t.call(victim, 'PATCH', `${base}/${randomUUID()}`, { birthYear: 2020 });
    expect(missing.status).toBe(404);
    expect(missing.headers.get('cache-control')).toBe('no-store');
  });

  it('TC-444: withdrawn trả 409 và giữ nguyên dữ liệu', async () => {
    const main = await t.session(await t.family());
    const profile = await create(main, { linkedAccountId: main.accountId, consent: { kind: 'self' } });
    expect((await t.call(main, 'POST', '/api/me/consent/withdraw', {})).status).toBe(200);
    const before = await row(profile.id);
    const response = await t.call(main, 'PATCH', `${base}/${profile.id}`, { birthYear: 2021 });
    expect(response.status).toBe(409);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    expect(await row(profile.id)).toEqual(before);
  });

  it('TC-444: bản sửa sai trả 422, không ghi một phần dữ liệu', async () => {
    const main = await t.session(await t.family());
    const profile = await create(main);
    const before = await row(profile.id);
    const future =
      Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
        }).format(new Date()),
      ) + 1;
    for (const body of [
      {},
      { displayName: 'Tên khác' },
      { birthYear: null },
      { birthYear: '2020' },
      { birthYear: 1899 },
      { birthYear: future, vitalsEnabled: true },
      { birthYear: 2000.5 },
      { vitalsEnabled: null },
      { vitalsEnabled: 'true' },
    ]) {
      const response = await t.call(main, 'PATCH', `${base}/${profile.id}`, body);
      expect(response.status).toBe(422);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect(await row(profile.id)).toEqual(before);
  });
});
