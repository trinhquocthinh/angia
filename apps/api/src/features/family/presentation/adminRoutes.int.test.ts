import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { type AdminTestApp, startAdminTestApp } from '@src/shared/test/startAdminTestApp.js';

describe('API Quản trị hệ thống: SPEC-001 → SPEC-003', () => {
  let t: AdminTestApp;

  const membership = (accountId: string) => `/api/admin/accounts/${accountId}/membership`;

  beforeAll(async () => {
    t = await startAdminTestApp();
  });

  afterAll(async () => {
    await t?.stop();
  });

  it('TC-001: Quản trị hệ thống tạo nhóm "Nhà Thịnh" thành công với 0 tài khoản thành viên', async () => {
    const response = await t.call(t.admin, 'POST', '/api/admin/families', { name: 'Nhà Thịnh' });
    expect(response.status).toBe(201);
    const family = (await response.json()) as { id: string };
    expect(family).toEqual({ id: expect.any(String), name: 'Nhà Thịnh', createdAt: expect.any(String) });
    const { rows } = await t.owner.query(`SELECT count(*)::int AS n FROM accounts WHERE family_id = $1`, [
      family.id,
    ]);
    expect(rows[0].n).toBe(0);
  });

  it('TC-002: phiên main không phải admin gọi tạo nhóm bị ERR_FORBIDDEN, không tạo nhóm mới', async () => {
    const main = await seedSession(
      t.owner,
      await seedAccount(t.owner, { familyId: await t.seedFamily(), familyRole: 'main' }),
    );
    const countFamilies = async () =>
      (await t.owner.query(`SELECT count(*)::int AS n FROM families`)).rows[0].n;
    const before = await countFamilies();
    const response = await t.call(main, 'POST', '/api/admin/families', { name: 'Nhà lạ' });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    expect(await countFamilies()).toBe(before);
  });

  it('TC-003: gán tài khoản A vào nhóm trống với vai trò main thành công', async () => {
    const [familyId, accountId] = [await t.seedFamily(), await seedAccount(t.owner)];
    const response = await t.call(t.admin, 'POST', membership(accountId), { familyId, role: 'main' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: accountId,
      displayName: 'Người chờ',
      isSystemAdmin: false,
      familyId,
      role: 'main',
    });
    expect(await t.membershipOf(accountId)).toMatchObject({ family_id: familyId, family_role: 'main' });
  });

  it('TC-004: gán tài khoản A vào nhóm trống với vai trò member bị ERR_FIRST_ACCOUNT_MUST_BE_MAIN', async () => {
    const [familyId, accountId] = [await t.seedFamily(), await seedAccount(t.owner)];
    const response = await t.call(t.admin, 'POST', membership(accountId), { familyId, role: 'member' });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: {
        code: 'ERR_FIRST_ACCOUNT_MUST_BE_MAIN',
        message: 'Người đầu tiên của nhóm gia đình bắt buộc phải là người chăm sóc chính.',
      },
    });
    expect(await t.membershipOf(accountId)).toMatchObject({ family_id: null, family_role: null });
  });

  it('TC-005: tài khoản A thuộc Nhóm 1 gán sang Nhóm 2 bị ERR_ACCOUNT_ALREADY_IN_FAMILY, A vẫn ở Nhóm 1', async () => {
    const [family1, family2] = [await t.seedFamily('Nhóm 1'), await t.seedFamily('Nhóm 2')];
    const accountId = await seedAccount(t.owner, { familyId: family1, familyRole: 'main' });
    const response = await t.call(t.admin, 'POST', membership(accountId), {
      familyId: family2,
      role: 'main',
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_ACCOUNT_ALREADY_IN_FAMILY' } });
    expect(await t.membershipOf(accountId)).toMatchObject({ family_id: family1, family_role: 'main' });
  });

  it('TC-006: nhóm có hai main A và B, chuyển A thành member thành công, còn lại B là main', async () => {
    const familyId = await t.seedFamily();
    const a = await seedAccount(t.owner, { familyId, familyRole: 'main' });
    const b = await seedAccount(t.owner, { familyId, familyRole: 'main' });
    const response = await t.call(t.admin, 'PATCH', membership(a), { action: 'change_role', role: 'member' });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: a, familyId, role: 'member' });
    const { rows } = await t.owner.query(
      `SELECT id FROM accounts WHERE family_id = $1 AND family_role = 'main'`,
      [familyId],
    );
    expect(rows).toEqual([{ id: b }]);
  });

  it('TC-007: nhóm chỉ còn một main A, gỡ A (hoặc hạ vai trò) bị ERR_LAST_MAIN, A vẫn là main', async () => {
    const familyId = await t.seedFamily();
    const a = await seedAccount(t.owner, { familyId, familyRole: 'main' });
    await seedAccount(t.owner, { familyId, familyRole: 'member' });
    for (const body of [{ action: 'remove' }, { action: 'change_role', role: 'member' }]) {
      const response = await t.call(t.admin, 'PATCH', membership(a), body);
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({
        error: {
          code: 'ERR_LAST_MAIN',
          message: 'Nhóm gia đình bắt buộc phải duy trì ít nhất một người chăm sóc chính.',
        },
      });
    }
    expect(await t.membershipOf(a)).toMatchObject({ family_id: familyId, family_role: 'main' });
  });
});
