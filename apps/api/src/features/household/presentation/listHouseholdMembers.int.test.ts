import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';

const path = '/api/family/members';
describe('E28-S3-T1: danh sách thành viên trong nhà', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('main và member thấy đủ, Chủ hộ trước, rồi vai trò, tên và UUID; chỉ trả trường hợp đồng', async () => {
    const family = await t.family();
    const owner = await t.session(family, 'main', 'Z');
    const mainZ = await t.session(family, 'main', 'Z');
    const mainA = await t.session(family, 'main', 'A');
    const memberZ = await t.session(family, 'member', 'Z');
    const memberA = await t.session(family, 'member', 'A');
    const memberA2 = await t.session(family, 'member', 'A');
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
    const tied = [memberA, memberA2].sort((a, b) => (a.accountId < b.accountId ? -1 : 1));
    const ordered = [owner, mainA, mainZ, ...tied, memberZ];
    const names = ['Z', 'A', 'Z', 'A', 'A', 'Z'];
    for (const user of [owner, mainA, memberA]) {
      const response = await t.call(user, 'GET', path);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({
        members: ordered.map((account, i) => ({
          accountId: account.accountId,
          displayName: names[i],
          role: i < 3 ? 'main' : 'member',
          isOwner: i === 0,
          isSelf: account.accountId === user.accountId,
        })),
      });
    }
  });

  it('cô lập chéo gia đình: mỗi nhà chỉ thấy tài khoản có family_id của phiên', async () => {
    const a = await t.session(await t.family(), 'main', 'Nhà A');
    const b = await t.session(await t.family(), 'member', 'Nhà B');
    for (const [user, name] of [
      [a, 'Nhà A'],
      [b, 'Nhà B'],
    ] as const) {
      const response = await t.call(user, 'GET', path);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        members: [
          {
            accountId: user.accountId,
            displayName: name,
            role: user === a ? 'main' : 'member',
            isOwner: false,
            isSelf: true,
          },
        ],
      });
    }
  });

  it('chưa có nhà trả 403 ERR_FORBIDDEN; chưa đăng nhập trả 401', async () => {
    const pending = await seedSession(t.owner, await seedAccount(t.owner));
    const response = await t.call(pending, 'GET', path);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    expect((await t.app.request(path)).status).toBe(401);
  });
});
