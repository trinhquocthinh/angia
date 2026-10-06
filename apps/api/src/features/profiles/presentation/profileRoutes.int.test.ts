import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, ConsentConfirmationResponse } from '@angia/contracts';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

const base = '/api/health-profiles';
const consent = (id: string) => `${base}/${id}/consent`;

describe('Hồ sơ: route thật, transaction và RLS', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-008: hồ sơ độc lập chưa đồng thuận, list chỉ trong gia đình và không cache', async () => {
    const [a, b] = await Promise.all([t.family(), t.family()]);
    const [main, other] = await Promise.all([t.session(a), t.session(b)]);
    const created = await t.call(main, 'POST', base, { displayName: ' Bé An ', birthYear: 2020 });
    expect(created.status).toBe(201);
    expect(created.headers.get('cache-control')).toBe('no-store');
    const profile = (await created.json()) as HealthProfile;
    expect(profile).toMatchObject({
      familyId: a,
      displayName: 'Bé An',
      consentConfirmedAt: null,
      consentConfirmedBy: null,
      consentBasis: null,
    });
    const read = () => t.call(other, 'POST', consent(profile.id), { confirmedBy: 'guardian' });
    await expectCrossFamilyDenied(read, () =>
      t.call(other, 'POST', consent(randomUUID()), { confirmedBy: 'guardian' }),
    );
    expect(await (await t.call(main, 'GET', base)).json()).toEqual([profile]);
    expect(await (await t.call(other, 'GET', base)).json()).toEqual([]);
    expect((await t.pool.query('SELECT count(*)::int AS n FROM health_profiles')).rows[0].n).toBe(0);
  });
  it('TC-009: hai request cùng liên kết tài khoản chỉ một thành công, không hồ sơ dư', async () => {
    const family = await t.family();
    const main = await t.session(family);
    const responses = await Promise.all([
      t.call(main, 'POST', base, { displayName: 'Mẹ', linkedAccountId: main.accountId }),
      t.call(main, 'POST', base, { displayName: 'Mẹ nữa', linkedAccountId: main.accountId }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    const failure = responses.find((r) => r.status === 409)!;
    expect(await failure.json()).toMatchObject({ error: { code: 'ERR_PROFILE_ALREADY_LINKED' } });
    const list = (await (await t.call(main, 'GET', base)).json()) as HealthProfile[];
    expect(list).toHaveLength(1);
    const row = (await t.owner.query('SELECT health_profile_id FROM accounts WHERE id=$1', [main.accountId]))
      .rows[0];
    expect(row.health_profile_id).toBe(list[0]!.id);
    expect(await (await t.call(main, 'GET', `${base}/linkable-accounts`)).json()).toEqual([]);
  });
  it('TC-010: tạo liên kết với tài khoản nhóm khác nhận lỗi giống ID không tồn tại', async () => {
    const [a, b] = await Promise.all([t.family(), t.family()]);
    const [main, other] = await Promise.all([t.session(a), t.session(b)]);
    await expectCrossFamilyDenied(
      () => t.call(main, 'POST', base, { displayName: 'Lén', linkedAccountId: other.accountId }),
      () => t.call(main, 'POST', base, { displayName: 'Lén', linkedAccountId: randomUUID() }),
    );
    expect(await (await t.call(main, 'GET', `${base}/linkable-accounts`)).json()).toEqual([
      { id: main.accountId, displayName: 'Người chăm' },
    ]);
    expect(await (await t.call(main, 'GET', base)).json()).toEqual([]);
  });
  it('đồng thuận đồng thời trả hai kết quả riêng, giữ metadata người thắng', async () => {
    const family = await t.family();
    const [a, b] = await Promise.all([t.session(family, 'main', 'An'), t.session(family, 'main', 'Bình')]);
    const profile = (await (await t.call(a, 'POST', base, { displayName: 'Mẹ' })).json()) as HealthProfile;
    const responses = await Promise.all([
      t.call(a, 'POST', consent(profile.id), { confirmedBy: 'guardian' }),
      t.call(b, 'POST', consent(profile.id), { confirmedBy: 'self' }),
    ]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    const results = await Promise.all(responses.map((r) => r.json() as Promise<ConsentConfirmationResponse>));
    expect(results.map((r) => r.outcome).sort()).toEqual(['already_confirmed', 'confirmed']);
    const first = results.find((r) => r.outcome === 'confirmed')!;
    const again = results.find((r) => r.outcome === 'already_confirmed')!;
    expect(again.profile).toEqual(first.profile);
    expect(again.confirmedByDisplayName).toBe(first.confirmedByDisplayName);
    const expectedName = first.profile.consentConfirmedBy === a.accountId ? 'An' : 'Bình';
    expect(first.confirmedByDisplayName).toBe(expectedName);
    expect(first.profile.consentBasis).toBe(
      first.profile.consentConfirmedBy === a.accountId ? 'guardian' : 'self',
    );
    const third = await (await t.call(b, 'POST', consent(profile.id), { confirmedBy: 'guardian' })).json();
    expect(third).toEqual({ ...first, outcome: 'already_confirmed' });
  });
  it('người xác nhận chuyển gia đình thì không lộ tên người đó trong gia đình cũ', async () => {
    const [family, next] = await Promise.all([t.family(), t.family()]);
    const [a, b] = await Promise.all([t.session(family), t.session(family)]);
    const profile = (await (await t.call(a, 'POST', base, { displayName: 'Mẹ' })).json()) as HealthProfile;
    expect((await t.call(a, 'POST', consent(profile.id), { confirmedBy: 'guardian' })).status).toBe(200);
    await t.owner.query('UPDATE accounts SET family_id=$1 WHERE id=$2', [next, a.accountId]);
    const result = await (await t.call(b, 'POST', consent(profile.id), { confirmedBy: 'self' })).json();
    expect(result).toMatchObject({ outcome: 'already_confirmed', confirmedByDisplayName: null });
  });
  it('member, admin không phải main và phiên thiếu CSRF bị chặn trước validate', async () => {
    const family = await t.family();
    const member = await t.session(family, 'member', 'Thành viên', true);
    for (const [method, path, body] of [
      ['GET', base, undefined],
      ['GET', `${base}/linkable-accounts`, undefined],
      ['POST', base, {}],
      ['POST', consent(randomUUID()), {}],
    ] as const) {
      expect((await t.call(member, method, path, body)).status).toBe(403);
    }
    const main = await t.session(family);
    expect(
      (
        await t.app.request(base, {
          method: 'POST',
          headers: { cookie: main.cookie, 'content-type': 'application/json' },
          body: JSON.stringify({ displayName: 'Mẹ' }),
        })
      ).status,
    ).toBe(403);
    expect((await t.app.request(base)).status).toBe(401);
    const future =
      Number(
        new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(
          new Date(),
        ),
      ) + 1;
    for (const birthYear of [1899, future, 2000.5]) {
      expect((await t.call(main, 'POST', base, { displayName: 'Mẹ', birthYear })).status).toBe(422);
    }
  });
});
