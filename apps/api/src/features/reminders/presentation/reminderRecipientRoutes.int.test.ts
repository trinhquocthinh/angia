import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('API người nhận nhắc thuốc + RLS (SPEC-026)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const fixture = async (consent = true) => {
    const familyId = await t.family();
    const dad = await t.session(familyId, 'main', 'Bố');
    const mom = await t.session(familyId, 'main', 'Mẹ');
    const grandma = await t.session(familyId, 'member', 'Bà');
    const create = async (body: object) =>
      (await (await t.call(dad, 'POST', '/api/health-profiles', body)).json()) as HealthProfile;
    const child = await create({ displayName: 'Bé An' });
    if (consent) await acceptConsentInvitation(t, dad, child.id);
    const path = (id: string) => `/api/health-profiles/${id}/reminder-recipients`;
    const put = (ids: string[], id = child.id) => t.call(dad, 'PUT', path(id), { recipientAccountIds: ids });
    const rows = async () =>
      (
        await t.owner.query(
          `SELECT r.account_id FROM reminder_recipients r JOIN accounts a ON a.id = r.account_id
           WHERE r.health_profile_id=$1 ORDER BY a.display_name`,
          [child.id],
        )
      ).rows.map((r: { account_id: string }) => r.account_id);
    const parents = [
      { accountId: dad.accountId, displayName: 'Bố' },
      { accountId: mom.accountId, displayName: 'Mẹ' },
    ];
    return { familyId, dad, mom, grandma, create, child, path, put, rows, parents };
  };

  it('TC-069: chỉ định cha và mẹ (main) cho "Bé An" lưu 02 người nhận; GET trả cùng dữ liệu', async () => {
    const f = await fixture();
    expect(await (await t.call(f.dad, 'GET', f.path(f.child.id))).json()).toEqual({
      mode: 'assigned',
      recipients: [],
      candidates: f.parents,
    });
    const response = await f.put([f.dad.accountId, f.mom.accountId]);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const expected = { mode: 'assigned', recipients: f.parents, candidates: f.parents };
    expect(await response.json()).toEqual(expected);
    expect(await f.rows()).toEqual([f.dad.accountId, f.mom.accountId]);
    expect(await (await t.call(f.mom, 'GET', f.path(f.child.id))).json()).toEqual(expected);
  });
  it('TC-070: chỉ định tài khoản member, tài khoản gia đình khác hoặc danh sách rỗng đều 422, không ghi', async () => {
    const f = await fixture();
    await f.put([f.mom.accountId]);
    const outsider = await t.session(await t.family());
    for (const ids of [[f.grandma.accountId], [f.dad.accountId, outsider.accountId], [], ['not-uuid']]) {
      const response = await f.put(ids);
      expect({ ids, status: response.status }).toEqual({ ids, status: 422 });
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect(await f.rows()).toEqual([f.mom.accountId]);
  });
  it('hồ sơ liên kết tài khoản: người nhận cố định, PUT trả 422', async () => {
    const f = await fixture();
    const linked = await f.create({ displayName: 'Bà', linkedAccountId: f.grandma.accountId });
    await acceptConsentInvitation(t, f.dad, linked.id);
    expect(await (await t.call(f.dad, 'GET', f.path(linked.id))).json()).toEqual({
      mode: 'linked',
      recipients: [{ accountId: f.grandma.accountId, displayName: 'Bà' }],
      candidates: f.parents,
    });
    expect((await f.put([f.dad.accountId], linked.id)).status).toBe(422);
  });
  it('người nhận bị hạ xuống member không còn được tính', async () => {
    const f = await fixture();
    await f.put([f.dad.accountId, f.mom.accountId]);
    await t.owner.query(`UPDATE accounts SET family_role='member' WHERE id=$1`, [f.mom.accountId]);
    expect(await (await t.call(f.dad, 'GET', f.path(f.child.id))).json()).toMatchObject({
      recipients: [f.parents[0]],
    });
  });
  it('đồng thuận/main/CSRF/phiên được cưỡng chế', async () => {
    const f = await fixture(false);
    const response = await f.put([f.dad.accountId]);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    const body = { recipientAccountIds: [f.dad.accountId] };
    expect((await t.call(f.grandma, 'PUT', f.path(f.child.id), body)).status).toBe(403);
    expect((await t.call(f.grandma, 'GET', f.path(f.child.id))).status).toBe(403);
    const noCsrf = await t.app.request(f.path(f.child.id), {
      method: 'PUT',
      headers: { cookie: f.dad.cookie, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(noCsrf.status).toBe(403);
    expect((await t.app.request(f.path(f.child.id), { method: 'PUT' })).status).toBe(401);
    expect(await f.rows()).toEqual([]);
  });
  it('GET/PUT chéo gia đình giống hồ sơ không tồn tại, không ghi', async () => {
    const f = await fixture();
    await f.put([f.dad.accountId]);
    const foreign = await t.session(await t.family());
    const missing = f.path(randomUUID());
    const body = { recipientAccountIds: [foreign.accountId] };
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'GET', f.path(f.child.id)),
      () => t.call(foreign, 'GET', missing),
    );
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'PUT', f.path(f.child.id), body),
      () => t.call(foreign, 'PUT', missing, body),
    );
    expect(await f.rows()).toEqual([f.dad.accountId]);
  });
  it('hai lệnh lưu đồng thời được tuần tự hóa, không lỗi khóa chính', async () => {
    const f = await fixture();
    const responses = await Promise.all([
      f.put([f.dad.accountId, f.mom.accountId]),
      f.put([f.mom.accountId]),
    ]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect((await f.rows()).length).toBeGreaterThan(0);
  });
});
