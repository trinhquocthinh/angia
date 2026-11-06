import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSelfProfileRepository } from '@src/features/selfProfile/infrastructure/createSelfProfileRepository.js';
import { getLabSeries } from '@src/features/labResults/application/getLabSeries.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { expectSelfScopeDenied } from '@src/shared/test/expectSelfScopeDenied.js';
import {
  HEALTH_DATA_ROUTES,
  MEMBER_BLOCKED_SESSION_ROUTES,
  type RouteOfKind,
} from '@src/shared/test/healthDataRoutes.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import {
  linkAccount,
  SELF_REMINDER_DATE,
  SELF_EXTRA_QUERY,
  SELF_SERIES_QUERY,
  seedSelfProfileData,
} from '@src/shared/test/seedSelfProfileData.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const BASE = '/api/me/profile';
const PATHS: Record<RouteOfKind<'self'>, string> = {
  'GET /api/me/profile/pain-issues': `${BASE}/pain-issues`,
  'GET /api/me/profile/pain-issues/:issueId': `${BASE}/pain-issues/:issueId`,
  'GET /api/me/profile/pain-issues/:issueId/context': `${BASE}/pain-issues/:issueId/context`,
  'GET /api/me/profile/pain-issues/:issueId/deletion-impact': `${BASE}/pain-issues/:issueId/deletion-impact`,
  'GET /api/me/profile': BASE,
  'GET /api/me/profile/medications/current': `${BASE}/medications/current`,
  'GET /api/me/profile/reminders': `${BASE}/reminders?date=${SELF_REMINDER_DATE}`,
  'GET /api/me/profile/revisits': `${BASE}/revisits`,
  'GET /api/me/profile/timeline': `${BASE}/timeline`,
  'GET /api/me/profile/measurements/series': `${BASE}/measurements/series?${SELF_SERIES_QUERY}`,
  'GET /api/me/profile/lab-result-series': `${BASE}/lab-result-series`,
  'GET /api/me/profile/temperatures': `${BASE}/temperatures?${SELF_EXTRA_QUERY}`,
  'GET /api/me/profile/as-needed-doses': `${BASE}/as-needed-doses?${SELF_EXTRA_QUERY}`,
};
const paths = Object.values(PATHS);

describe('Hồ sơ của tôi: route tự xem (SPEC-042, E14-S3-T1)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  const setup = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const mother = await seedSelfProfileData(t, main, familyId, 'Mẹ');
    const father = await seedSelfProfileData(t, main, familyId, 'Ba');
    const member = await t.session(familyId, 'member', 'Mẹ dùng app');
    await linkAccount(t, member.accountId, mother.profile.id);
    return { familyId, main, member, mother, father };
  };
  type Fixture = Awaited<ReturnType<typeof setup>>;
  const ownMarkers = (f: Fixture): Record<RouteOfKind<'self'>, string> => ({
    'GET /api/me/profile/pain-issues': f.mother.marker.pain,
    'GET /api/me/profile/pain-issues/:issueId': f.mother.marker.pain,
    'GET /api/me/profile/pain-issues/:issueId/context': f.mother.marker.course,
    'GET /api/me/profile/pain-issues/:issueId/deletion-impact': 'entryCount',
    'GET /api/me/profile': f.mother.profile.id,
    'GET /api/me/profile/medications/current': f.mother.marker.course,
    'GET /api/me/profile/reminders': f.mother.marker.reminder,
    'GET /api/me/profile/revisits': f.mother.marker.facility,
    'GET /api/me/profile/timeline': f.mother.marker.lab,
    'GET /api/me/profile/measurements/series': f.mother.marker.measurement,
    'GET /api/me/profile/lab-result-series': f.mother.marker.lab,
    'GET /api/me/profile/temperatures': f.mother.marker.temperature,
    'GET /api/me/profile/as-needed-doses': f.mother.marker.dose,
  });
  const expectOnlyMother = async (f: Fixture) => {
    const own = ownMarkers(f);
    for (const route of Object.keys(PATHS) as RouteOfKind<'self'>[]) {
      await expectSelfScopeDenied(
        () => t.call(f.member, 'GET', PATHS[route].replace(':issueId', f.mother.marker.pain)),
        own[route],
        [f.father.profile.id, ...f.father.foreign],
      ).catch((error: Error) => {
        throw new Error(`${route}: ${error.message}`);
      });
    }
  };

  it('TC-565, TC-566: mọi route chỉ trả dữ liệu hồ sơ liên kết, no-store', async () => {
    const f = await setup();
    await expectOnlyMother(f);
    for (const path of paths) {
      const response = await t.call(f.member, 'GET', path.replace(':issueId', f.mother.marker.pain));
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
    expect(await (await t.call(f.member, 'GET', BASE)).json()).toEqual({
      id: f.mother.profile.id,
      displayName: 'Mẹ',
      birthYear: 1950,
      consentStatus: 'confirmed',
      showsVitals: true,
    });
  });

  it('TC-566: tài khoản gia đình khác trỏ sang hồ sơ nạn nhân nhận đúng phản hồi của tài khoản không liên kết', async () => {
    const f = await setup();
    const otherFamily = await t.family();
    const accountId = await seedAccount(t.owner, { familyId: otherFamily, familyRole: 'member' });
    const forged = await seedSession(t.owner, accountId);
    await linkAccount(t, accountId, f.father.profile.id);
    const unlinked = await t.session(otherFamily, 'member', 'Chưa liên kết');
    for (const path of paths) {
      await expectCrossFamilyDenied(
        () => t.call(forged, 'GET', path.replace(':issueId', f.mother.marker.pain)),
        () => t.call(unlinked, 'GET', path.replace(':issueId', f.mother.marker.pain)),
      );
    }
  });

  it('TC-571 (a): tài khoản không liên kết nhận 404 mọi route, kể cả main', async () => {
    const f = await setup();
    const unlinked = await t.session(f.familyId, 'member', 'Chưa liên kết');
    for (const user of [unlinked, f.main]) {
      for (const path of paths)
        expect((await t.call(user, 'GET', path.replace(':issueId', f.mother.marker.pain))).status).toBe(404);
    }
  });

  it('TC-571 (b): hồ sơ đã rút đồng thuận nhận 409, riêng /api/me/profile trả trạng thái', async () => {
    const f = await setup();
    expect((await t.call(f.member, 'POST', '/api/me/consent/withdraw', {})).status).toBe(200);
    const summary = await t.call(f.member, 'GET', BASE);
    expect(summary.status).toBe(200);
    expect(await summary.json()).toMatchObject({ consentStatus: 'withdrawn' });
    for (const path of paths.filter((p) => p !== BASE)) {
      const response = await t.call(f.member, 'GET', path.replace(':issueId', f.mother.marker.pain));
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    }
  });

  it('TC-571 (c): bé chưa bật số đo: series 404, dòng thời gian không có số đo cũ', async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const childYear = new Date().getFullYear() - 5;
    const child = await seedSelfProfileData(t, main, familyId, 'Bé', childYear);
    const member = await t.session(familyId, 'member', 'Bé dùng app');
    await linkAccount(t, member.accountId, child.profile.id);
    expect((await t.call(member, 'GET', PATHS['GET /api/me/profile/measurements/series'])).status).toBe(404);
    const timeline = await t.call(member, 'GET', PATHS['GET /api/me/profile/timeline']);
    expect(timeline.status).toBe(200);
    expect(await timeline.text()).not.toContain(child.marker.measurement);
    expect(await (await t.call(member, 'GET', BASE)).json()).toMatchObject({ showsVitals: false });
  });

  it('TC-572: tài khoản liên kết vẫn bị 403 ở route main, kể cả với id hồ sơ của mình', async () => {
    const f = await setup();
    for (const route of MEMBER_BLOCKED_SESSION_ROUTES) {
      const [method, pattern] = route.split(' ') as [string, string];
      const path = pattern.replace(':id', f.mother.profile.id);
      expect({ route, status: (await t.call(f.member, method, path)).status }).toEqual({
        route,
        status: 403,
      });
    }
    const selfRoutes = Object.entries(HEALTH_DATA_ROUTES).filter(([, kind]) => kind === 'self');
    expect(selfRoutes.filter(([route]) => /document|image|visit-summary/.test(route))).toEqual([]);
  });

  it('main có hồ sơ liên kết dùng được route tự xem', async () => {
    const f = await setup();
    await linkAccount(t, f.main.accountId, f.father.profile.id);
    const summary = await t.call(f.main, 'GET', BASE);
    expect(await summary.json()).toMatchObject({ id: f.father.profile.id });
    for (const suffix of ['temperatures', 'as-needed-doses']) {
      const self = await t.call(f.main, 'GET', `${BASE}/${suffix}?${SELF_EXTRA_QUERY}`);
      const main = await t.call(
        f.main,
        'GET',
        `/api/health-profiles/${f.father.profile.id}/${suffix}?${SELF_EXTRA_QUERY}`,
      );
      expect(self.status).toBe(200);
      expect(await self.json()).toEqual(await main.json());
    }
  });

  it('TC-502/566: tự xem liều và nhiệt độ không bị ẩn theo số đo, giữ bộ lọc và validation', async () => {
    const f = await setup();
    await t.owner.query('UPDATE health_profiles SET birth_year=2021 WHERE id=$1', [f.mother.profile.id]);
    for (const suffix of ['temperatures', 'as-needed-doses']) {
      const path = `${BASE}/${suffix}`;
      const valid = await t.call(f.member, 'GET', `${path}?${SELF_EXTRA_QUERY}`);
      expect(valid.status).toBe(200);
      expect(await valid.text()).toContain(
        suffix === 'temperatures' ? f.mother.marker.temperature : f.mother.marker.dose,
      );
      const empty = await t.call(f.member, 'GET', `${path}?from=2020-01-01&to=2020-01-01`);
      expect(await empty.json()).toEqual(suffix === 'temperatures' ? { readings: [] } : { doses: [] });
      for (const query of ['', '?from=2026-10-02&to=2026-10-01', '?from=2020-01-01&to=2026-01-01'])
        expect((await t.call(f.member, 'GET', `${path}${query}`)).status).toBe(422);
      expect((await t.app.request(`${path}?${SELF_EXTRA_QUERY}`)).status).toBe(401);
    }
    const response = await t.call(
      f.member,
      'GET',
      `${BASE}/as-needed-doses?${SELF_EXTRA_QUERY}&courseId=${f.father.profile.id}`,
    );
    expect(await response.json()).toEqual({ doses: [] });
  });

  it('tài khoản chưa thuộc gia đình nhận 403; ngày sai định dạng nhận 422', async () => {
    const f = await setup();
    const pending = await seedSession(t.owner, await seedAccount(t.owner));
    expect((await t.call(pending, 'GET', BASE)).status).toBe(403);
    expect((await t.call(f.member, 'GET', `${BASE}/reminders?date=hôm-nay`)).status).toBe(422);
  });

  describe('TC-567 (tầng route): phá thử từng lớp', () => {
    // Bỏ điều kiện tự xem ở mọi policy, giữ điều kiện gia đình; luôn khôi phục kể cả khi test đỏ.
    const withoutSelfPolicies = async (check: () => Promise<void>) => {
      const { rows } = await t.owner.query<{ tablename: string; qual: string }>(
        `SELECT tablename, qual FROM pg_policies WHERE policyname = 'family_isolation_policy'`,
      );
      expect(rows.length).toBeGreaterThan(0);
      const alter = (table: string, using: string) =>
        t.owner.query(`ALTER POLICY family_isolation_policy ON ${table} USING (${using})`);
      for (const { tablename } of rows)
        await alter(tablename, `family_id = NULLIF(current_setting('app.family_id', true), '')::uuid`);
      try {
        await check();
      } finally {
        for (const { tablename, qual } of rows) await alter(tablename, qual);
      }
    };
    const readFather = (f: Fixture) =>
      getLabSeries(createSelfProfileRepository(t.database).forProfile(f.mother.profile.id).labResults, {
        familyId: f.familyId,
        profileId: f.father.profile.id,
      });

    it('tắt điều kiện tự xem trong policy: lọc ở application vẫn chỉ trả hồ sơ Mẹ', async () => {
      const f = await setup();
      await withoutSelfPolicies(() => expectOnlyMother(f));
    });

    it('bỏ lọc ở application (truy vấn trỏ hồ sơ Ba): RLS chặn', async () => {
      const f = await setup();
      expect(await readFather(f)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    });

    it('gỡ cả hai lớp: lộ hồ sơ Ba (chứng minh test phát hiện được)', async () => {
      const f = await setup();
      await withoutSelfPolicies(async () => {
        const leaked = await readFather(f);
        expect(leaked).toMatchObject({ ok: true, value: [{ testName: f.father.marker.lab }] });
      });
    });
  });
});
