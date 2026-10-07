import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { type AdminTestApp, startAdminTestApp } from '@src/shared/test/startAdminTestApp.js';

describe('API Quản trị hệ thống: danh sách, gỡ khỏi nhóm, lỗi biên và đồng thời', () => {
  let t: AdminTestApp;

  const membership = (accountId: string) => `/api/admin/accounts/${accountId}/membership`;

  beforeAll(async () => {
    t = await startAdminTestApp();
  });

  afterAll(async () => {
    await t?.stop();
  });

  it('GET families/accounts: liệt kê nhóm và tài khoản (gồm tài khoản chờ), không kèm liên kết hồ sơ', async () => {
    const familyId = await t.seedFamily('Nhà liệt kê');
    const waiting = await seedAccount(t.owner, { displayName: 'Chờ gán' });
    const families = await (await t.call(t.admin, 'GET', '/api/admin/families')).json();
    expect(families).toContainEqual(expect.objectContaining({ id: familyId, name: 'Nhà liệt kê' }));
    const response = await t.call(t.admin, 'GET', '/api/admin/accounts');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toContainEqual({
      id: waiting,
      displayName: 'Chờ gán',
      isSystemAdmin: false,
      familyId: null,
      role: null,
    });
  });

  it('gỡ member: về trạng thái chờ, gỡ liên kết hồ sơ, phiên của tài khoản thấy family null ngay', async () => {
    const familyId = await t.seedFamily();
    await seedAccount(t.owner, { familyId, familyRole: 'main' });
    const member = await seedAccount(t.owner, { familyId, familyRole: 'member' });
    const profileId = randomUUID();
    await t.owner.query(`INSERT INTO health_profiles (id, family_id, display_name) VALUES ($1, $2, 'Bố')`, [
      profileId,
      familyId,
    ]);
    await t.owner.query(`UPDATE accounts SET health_profile_id = $1 WHERE id = $2`, [profileId, member]);
    const memberSession = await seedSession(t.owner, member);

    const response = await t.call(t.admin, 'PATCH', membership(member), { action: 'remove' });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: member, familyId: null, role: null });
    expect(await t.membershipOf(member)).toEqual({
      family_id: null,
      family_role: null,
      health_profile_id: null,
    });
    const me = await (await t.call(memberSession, 'GET', '/api/me')).json();
    expect(me).toMatchObject({ family: null, role: null });
  });

  it('tài khoản/nhóm không tồn tại hoặc PATCH tài khoản chưa có nhóm trả 404 ERR_NOT_FOUND', async () => {
    const [familyId, waiting] = [await t.seedFamily(), await seedAccount(t.owner)];
    const responses = [
      await t.call(t.admin, 'POST', membership(randomUUID()), { familyId, role: 'main' }),
      await t.call(t.admin, 'POST', membership(waiting), { familyId: randomUUID(), role: 'main' }),
      await t.call(t.admin, 'PATCH', membership(randomUUID()), { action: 'remove' }),
      await t.call(t.admin, 'PATCH', membership(waiting), { action: 'remove' }),
    ];
    for (const response of responses) {
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
    }
  });

  it('dữ liệu sai định dạng trả 422 ERR_VALIDATION; tên nhóm được cắt khoảng trắng', async () => {
    const familyId = await t.seedFamily();
    const responses = [
      await t.call(t.admin, 'POST', '/api/admin/families', { name: '   ' }),
      await t.call(t.admin, 'POST', '/api/admin/families', { name: 'x'.repeat(61) }),
      await t.call(t.admin, 'POST', membership('khong-phai-uuid'), { familyId, role: 'main' }),
      await t.call(t.admin, 'POST', membership(randomUUID()), { familyId, role: 'admin' }),
      await t.call(t.admin, 'PATCH', membership(randomUUID()), { action: 'change_role' }),
    ];
    for (const response of responses) {
      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({
        error: { code: 'ERR_VALIDATION', message: 'Dữ liệu gửi lên không đúng định dạng quy định.' },
      });
    }
    const created = await t.call(t.admin, 'POST', '/api/admin/families', { name: '  Nhà Lan  ' });
    expect(await created.json()).toMatchObject({ name: 'Nhà Lan' });
  });

  it('mọi route /api/admin/* từ chối tài khoản không phải admin, kể cả khi body sai', async () => {
    const main = await seedSession(
      t.owner,
      await seedAccount(t.owner, { familyId: await t.seedFamily(), familyRole: 'main' }),
    );
    const responses = [
      await t.call(main, 'GET', '/api/admin/families'),
      await t.call(main, 'GET', '/api/admin/accounts'),
      await t.call(main, 'POST', membership(main.accountId), {}),
      await t.call(main, 'PATCH', membership(main.accountId), { action: 'remove' }),
    ];
    expect(responses.map((response) => response.status)).toEqual([403, 403, 403, 403]);
  });

  it('admin thiếu X-CSRF-Token khi tạo nhóm bị ERR_FORBIDDEN', async () => {
    const response = await t.app.request('/api/admin/families', {
      method: 'POST',
      headers: { cookie: t.admin.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Nhà' }),
    });
    expect(response.status).toBe(403);
  });

  it('hai lệnh hạ main chồng nhau: lệnh sau chờ khóa nhóm rồi nhận ERR_LAST_MAIN (BR-007)', async () => {
    const familyId = await t.seedFamily();
    const a = await seedAccount(t.owner, { familyId, familyRole: 'main' });
    const b = await seedAccount(t.owner, { familyId, familyRole: 'main' });
    // Giao dịch cạnh tranh theo đúng thứ tự khóa của repository: đã hạ A nhưng chưa commit.
    await t.owner.query('BEGIN');
    await t.owner.query(`SELECT id FROM accounts WHERE id = $1 FOR UPDATE`, [a]);
    await t.owner.query(`SELECT id FROM families WHERE id = $1 FOR UPDATE`, [familyId]);
    await t.owner.query(`UPDATE accounts SET family_role = 'member' WHERE id = $1`, [a]);
    const pending = t.call(t.admin, 'PATCH', membership(b), { action: 'change_role', role: 'member' });
    await new Promise((resolve) => setTimeout(resolve, 300));
    await t.owner.query('COMMIT');
    const response = await pending;
    expect(response.status).toBe(409);
    expect(await t.membershipOf(b)).toMatchObject({ family_role: 'main' });
  });
});
