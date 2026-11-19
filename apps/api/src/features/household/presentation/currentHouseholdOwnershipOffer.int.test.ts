import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

const path = '/api/family/ownership-offers/current';
describe('SPEC-068: đọc đề nghị trao quyền hiện tại', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  async function setup() {
    const family = await t.family();
    const owner = await t.session(family, 'main', 'An');
    const target = await t.session(family, 'main', 'Bình');
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
    const issued = await t.call(owner, 'POST', '/api/family/ownership-offers', {
      targetAccountId: target.accountId,
    });
    expect(issued.status).toBe(201);
    const offer = (await issued.json()) as { id: string; createdAt: string };
    return { family, owner, target, offer };
  }
  it('TC-928: Chủ hộ và người nhận đọc lại đúng DTO, GET không cần CSRF', async () => {
    const f = await setup();
    for (const user of [f.owner, f.target]) {
      const response = await t.app.request(path, { headers: { cookie: user.cookie } });
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({
        id: f.offer.id,
        status: 'pending',
        createdAt: f.offer.createdAt,
        offeredBy: { accountId: f.owner.accountId, displayName: 'An' },
        target: { accountId: f.target.accountId, displayName: 'Bình' },
      });
    }
    expect((await t.app.request(path)).status).toBe(401);
  });
  it('TC-929: Đồng quản lý khác và Thành viên không biết đề nghị tồn tại', async () => {
    const f = await setup();
    for (const role of ['main', 'member'] as const) {
      const response = await t.call(await t.session(f.family, role), 'GET', path);
      expect(response.status).toBe(404);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
    }
  });
  it.each(['revoked', 'accepted', 'declined'] as const)(
    'TC-930: đề nghị %s không còn hiện tại',
    async (status) => {
      const f = await setup();
      if (status === 'revoked')
        expect((await t.call(f.owner, 'DELETE', `/api/family/ownership-offers/${f.offer.id}`)).status).toBe(
          204,
        );
      else
        expect(
          (
            await t.call(f.target, 'POST', `/api/family/ownership-offers/${f.offer.id}/decision`, {
              accept: status === 'accepted',
            })
          ).status,
        ).toBe(204);
      for (const user of [f.owner, f.target]) {
        const response = await t.call(user, 'GET', path);
        expect(response.status).toBe(404);
        expect(await response.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
      }
    },
  );
  it('TC-931: nhà khác không thấy đề nghị, giống nhà chưa có đề nghị', async () => {
    const f = await setup();
    expect((await t.call(f.owner, 'GET', path)).status).toBe(200);
    const other = await t.session(await t.family());
    const empty = await t.session(await t.family());
    await expectCrossFamilyDenied(
      () => t.call(other, 'GET', path),
      () => t.call(empty, 'GET', path),
    );
  });
});
