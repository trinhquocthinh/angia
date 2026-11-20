import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

describe('SPEC-066: quản lý vai trò trong nhà', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const path = (id: string) => `/api/family/members/${id}`;

  it('TC-782: Đồng quản lý nâng Thành viên thành main, không đổi Chủ hộ', async () => {
    const family = await t.family();
    const owner = await t.session(family);
    const actor = await t.session(family);
    const target = await t.session(family, 'member');
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
    expect(
      (await t.call(actor, 'PATCH', path(target.accountId), { action: 'change_role', role: 'main' })).status,
    ).toBe(204);
    expect(
      (await t.owner.query('SELECT family_role FROM accounts WHERE id=$1', [target.accountId])).rows[0],
    ).toEqual({ family_role: 'main' });
    expect(
      (await t.owner.query('SELECT owner_account_id FROM families WHERE id=$1', [family])).rows[0],
    ).toEqual({ owner_account_id: owner.accountId });
  });

  it('TC-783: không được hạ vai trò hoặc gỡ Chủ hộ', async () => {
    const family = await t.family();
    const owner = await t.session(family);
    const actor = await t.session(family);
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
    for (const body of [{ action: 'remove' }, { action: 'change_role', role: 'member' }]) {
      const response = await t.call(actor, 'PATCH', path(owner.accountId), body);
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_OWNER_PROTECTED' } });
    }
  });

  it('TC-784: Thành viên không được quản lý người khác; main không tự thao tác', async () => {
    const family = await t.family();
    const actor = await t.session(family);
    const member = await t.session(family, 'member');
    expect((await t.call(member, 'PATCH', path(actor.accountId), { action: 'remove' })).status).toBe(403);
    for (const body of [{ action: 'remove' }, { action: 'change_role', role: 'member' }])
      expect((await t.call(actor, 'PATCH', path(actor.accountId), body)).status).toBe(403);
  });

  it('TC-789: đích khác nhà và ID không tồn tại trả cùng 404', async () => {
    const actor = await t.session(await t.family());
    const other = await t.session(await t.family());
    for (const body of [{ action: 'remove' }, { action: 'change_role', role: 'main' }])
      await expectCrossFamilyDenied(
        () => t.call(actor, 'PATCH', path(other.accountId), body),
        () => t.call(actor, 'PATCH', path(randomUUID()), body),
      );
  });

  it('TC-782: từ chối DTO sai, thiếu CSRF và yêu cầu không có phiên', async () => {
    const user = await t.session(await t.family());
    for (const body of [
      { action: 'change_role' },
      { action: 'remove', role: 'main' },
      { action: 'change_role', role: 'owner' },
    ])
      expect((await t.call(user, 'PATCH', path(randomUUID()), body)).status).toBe(422);
    expect((await t.app.request(path(randomUUID()), { method: 'PATCH' })).status).toBe(401);
    expect(
      (
        await t.app.request(path(randomUUID()), {
          method: 'PATCH',
          headers: { cookie: user.cookie, 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'remove' }),
        })
      ).status,
    ).toBe(403);
  });
});
