import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('API rút đồng thuận /api/me/consent (SPEC-036)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const GET = '/api/me/consent';
  const POST = '/api/me/consent/withdraw';
  const fixture = async (confirm = true) => {
    const familyId = await t.family();
    const dad = await t.session(familyId, 'main', 'Bố');
    const grandma = await t.session(familyId, 'member', 'Bà');
    const uncle = await t.session(familyId, 'member', 'Chú');
    const profile = (await (
      await t.call(dad, 'POST', '/api/health-profiles', {
        birthYear: 1950,
        displayName: 'Bà Tư',
        linkedAccountId: grandma.accountId,
      })
    ).json()) as HealthProfile;
    if (confirm) await acceptConsentInvitation(t, dad, profile.id);
    return { familyId, dad, grandma, uncle, profile };
  };
  const row = async (id: string) =>
    (
      await t.owner.query(
        'SELECT consent_status, consent_withdrawn_at, consent_withdrawn_by FROM health_profiles WHERE id=$1',
        [id],
      )
    ).rows[0] as {
      consent_status: string;
      consent_withdrawn_at: Date | null;
      consent_withdrawn_by: string | null;
    };

  it('TC-379: GET trả đúng tên, trạng thái, withdrawnAt và không trường nào khác; no-store', async () => {
    const f = await fixture();
    const response = await t.call(f.grandma, 'GET', GET);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      profile: { id: f.profile.id, displayName: 'Bà Tư', consentStatus: 'confirmed', withdrawnAt: null },
    });
  });
  it('TC-379: tài khoản không liên kết hồ sơ GET nhận profile null, POST nhận 404', async () => {
    const f = await fixture();
    const get = await t.call(f.uncle, 'GET', GET);
    expect(await get.json()).toEqual({ profile: null });
    const post = await t.call(f.uncle, 'POST', POST, {});
    expect(post.status).toBe(404);
    expect(post.headers.get('cache-control')).toBe('no-store');
    expect((await row(f.profile.id)).consent_status).toBe('confirmed');
  });
  it('TC-379: main không liên kết hồ sơ đó không rút thay được', async () => {
    const f = await fixture();
    expect((await t.call(f.dad, 'POST', POST, {})).status).toBe(404);
    expect((await row(f.profile.id)).consent_status).toBe('confirmed');
  });
  it('TC-379: ID hồ sơ tồn tại ở gia đình khác giống ID không tồn tại (cross-family) ở cả hai route', async () => {
    const f = await fixture();
    const other = await fixture();
    const stale = await t.session(f.familyId, 'member', 'Cũ');
    await t.owner.query('UPDATE accounts SET health_profile_id=NULL WHERE id=$1', [other.grandma.accountId]);
    await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [
      other.profile.id,
      stale.accountId,
    ]);
    const unlinked = await t.session(f.familyId, 'member', 'Mới');
    await expectCrossFamilyDenied(
      () => t.call(stale, 'POST', POST, {}),
      () => t.call(unlinked, 'POST', POST, {}),
    );
    expect(await (await t.call(stale, 'GET', GET)).json()).toEqual({ profile: null });
    expect((await row(other.profile.id)).consent_status).toBe('confirmed');
  });
  it('TC-379: rút thành công ghi DB, GET sau đó trả withdrawn kèm withdrawnAt, rút lần hai nhận 409', async () => {
    const f = await fixture();
    const response = await t.call(f.grandma, 'POST', POST, {});
    expect(response.status).toBe(200);
    const body = (await response.json()) as { consentStatus: string; withdrawnAt: string };
    expect(body.consentStatus).toBe('withdrawn');
    const stored = await row(f.profile.id);
    expect(stored.consent_status).toBe('withdrawn');
    expect(stored.consent_withdrawn_by).toBe(f.grandma.accountId);
    expect(stored.consent_withdrawn_at?.toISOString()).toBe(body.withdrawnAt);
    const after = await (await t.call(f.grandma, 'GET', GET)).json();
    expect(after).toEqual({
      profile: {
        id: f.profile.id,
        displayName: 'Bà Tư',
        consentStatus: 'withdrawn',
        withdrawnAt: body.withdrawnAt,
      },
    });
    const again = await t.call(f.grandma, 'POST', POST, {});
    expect(again.status).toBe(409);
    expect(await again.json()).toMatchObject({ error: { code: 'ERR_CONSENT_NOT_CONFIRMED' } });
  });
  it('TC-379: hồ sơ chưa đồng thuận thì POST nhận 409 và không đổi DB', async () => {
    const f = await fixture(false);
    expect((await t.call(f.grandma, 'POST', POST, {})).status).toBe(409);
    expect((await row(f.profile.id)).consent_withdrawn_at).toBeNull();
  });
  it('TC-379: hai POST đồng thời cho đúng một 200 và một 409', async () => {
    const f = await fixture();
    const results = await Promise.all([
      t.call(f.grandma, 'POST', POST, {}),
      t.call(f.grandma, 'POST', POST, {}),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  });
  it('TC-379: không phiên 401, POST thiếu CSRF 403, body thừa trường 422, chưa có gia đình 403', async () => {
    const f = await fixture();
    expect((await t.app.request(GET)).status).toBe(401);
    expect((await t.app.request(POST, { method: 'POST' })).status).toBe(401);
    const noCsrf = await t.app.request(POST, {
      method: 'POST',
      headers: { cookie: f.grandma.cookie, 'content-type': 'application/json' },
      body: '{}',
    });
    expect(noCsrf.status).toBe(403);
    expect((await t.call(f.grandma, 'POST', POST, { profileId: f.profile.id })).status).toBe(422);
    expect((await row(f.profile.id)).consent_status).toBe('confirmed');
    const waiting = await seedSession(t.owner, await seedAccount(t.owner));
    for (const [method, path] of [
      ['GET', GET],
      ['POST', POST],
    ] as const) {
      const response = await t.call(waiting, method, path, method === 'POST' ? {} : undefined);
      expect(response.status).toBe(403);
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
  });
});
