import { resetMemberPasswordResponseSchema } from '@angia/contracts';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
let familyId: string;
let ownerId: string;
let actorId: string;
let targetId: string;
let actor: Awaited<ReturnType<typeof seedSession>>;
let targetSession: Awaited<ReturnType<typeof seedSession>>;
const reset = (target = targetId, device = actor, csrf = device.csrf) =>
  t.app.request(`/api/family/members/${target}/password-reset`, {
    method: 'POST',
    headers: { cookie: device.cookie, 'x-csrf-token': csrf },
  });
const audit = async () =>
  (
    await t.owner.query(
      "SELECT * FROM admin_audit_events WHERE target_account_id=$1 AND action='password_reset_by_family'",
      [targetId],
    )
  ).rows;

beforeAll(async () => {
  t = await startRegistrationTestApp();
});
afterAll(async () => {
  await t?.close();
});
beforeEach(async () => {
  familyId = randomUUID();
  await t.owner.query('INSERT INTO families(id,name) VALUES($1,$2)', [familyId, 'Nhà thử']);
  ownerId = await seedAccount(t.owner, { familyId, familyRole: 'main' });
  actorId = await seedAccount(t.owner, { familyId, familyRole: 'main', displayName: 'Thịnh' });
  targetId = await seedAccount(t.owner, { familyId, familyRole: 'member' });
  await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [ownerId, familyId]);
  // Username tối đa 32 ký tự tại API đăng nhập.
  await t.owner.query('UPDATE accounts SET username_normalized=$1 WHERE id=$2', [
    targetId.replaceAll('-', ''),
    targetId,
  ]);
  await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
    targetId,
    await t.account.hasher.hash('OldPassword123'),
  ]);
  actor = await seedSession(t.owner, actorId);
  targetSession = await seedSession(t.owner, targetId);
});
const loginTemporary = (password: string) =>
  t.app.request('/api/auth/password-login', {
    method: 'POST',
    headers: { origin: 'https://angia.example', 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: targetId.replaceAll('-', ''), password }),
  });

describe('Đặt lại mật khẩu qua PostgreSQL bằng role app', () => {
  it('TC-756: đặt lại, thu hồi phiên, đăng nhập hạn chế và audit không chứa bí mật', async () => {
    const response = await reset();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = resetMemberPasswordResponseSchema.parse(await response.json());
    expect(Object.keys(body).sort()).toEqual(['expiresAt', 'temporaryPassword']);
    expect(body.temporaryPassword.length).toBeGreaterThanOrEqual(16);
    const account = (
      await t.owner.query('SELECT must_change_password,temp_password_expires_at FROM accounts WHERE id=$1', [
        targetId,
      ])
    ).rows[0];
    expect(account.must_change_password).toBe(true);
    expect(account.temp_password_expires_at.toISOString()).toBe(body.expiresAt);
    const credential = (
      await t.owner.query('SELECT * FROM account_credentials WHERE account_id=$1', [targetId])
    ).rows[0];
    expect(credential.credential_version).toBe(2);
    expect(await t.account.hasher.verify(credential.password_hash, body.temporaryPassword)).toBe(true);
    expect((await t.owner.query('SELECT id FROM sessions WHERE account_id=$1', [targetId])).rows).toEqual([]);
    expect((await t.app.request('/api/me', { headers: { cookie: targetSession.cookie } })).status).toBe(401);
    const loggedIn = await loginTemporary(body.temporaryPassword);
    expect(loggedIn.status).toBe(200);
    expect(await loggedIn.json()).toMatchObject({
      session: { passwordChangeRequired: true, passwordResetBy: 'Thịnh' },
    });
    const events = await audit();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      actor_account_id: actorId,
      family_id: familyId,
      target_account_id: targetId,
      metadata: {},
    });
    expect(JSON.stringify(events)).not.toContain(body.temporaryPassword);
    expect(JSON.stringify(events)).not.toContain(credential.password_hash);
    expect((await loginTemporary('OldPassword123')).status).toBe(401);
  });
  it('TC-757: không đặt lại cho Chủ hộ', async () => {
    const response = await reset(ownerId);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_OWNER_PROTECTED' } });
    expect(await audit()).toEqual([]);
  });
  it('TC-758: không đặt lại cho chính mình', async () => {
    const response = await reset(actorId);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
  });
  it('TC-759: Thành viên không đặt lại cho người khác', async () => {
    const response = await reset(actorId, targetSession);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
  });
  it('TC-760: nhà khác và đích không tồn tại có cùng ERR_NOT_FOUND', async () => {
    const otherFamily = randomUUID();
    await t.owner.query('INSERT INTO families(id,name) VALUES($1,$2)', [otherFamily, 'Nhà khác']);
    const other = await seedAccount(t.owner, { familyId: otherFamily, familyRole: 'member' });
    await expectCrossFamilyDenied(
      () => reset(other),
      () => reset(randomUUID()),
    );
    expect(await audit()).toEqual([]);
  });
  it('TC-761: mật khẩu tạm hết hạn trả ERR_INVALID_CREDENTIALS', async () => {
    const body = resetMemberPasswordResponseSchema.parse(await (await reset()).json());
    await t.owner.query(
      "UPDATE accounts SET temp_password_expires_at=now()-interval '1 second' WHERE id=$1",
      [targetId],
    );
    const response = await loginTemporary(body.temporaryPassword);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_INVALID_CREDENTIALS' } });
    expect((await t.owner.query('SELECT id FROM sessions WHERE account_id=$1', [targetId])).rows).toEqual([]);
  });
  it('OIDC chưa có credential được tạo local và đăng nhập bằng mật khẩu tạm', async () => {
    await t.owner.query('DELETE FROM account_credentials WHERE account_id=$1', [targetId]);
    const response = await reset();
    expect(response.status).toBe(200);
    const body = resetMemberPasswordResponseSchema.parse(await response.json());
    expect((await loginTemporary(body.temporaryPassword)).status).toBe(200);
    expect(
      (
        await t.owner.query('SELECT credential_version FROM account_credentials WHERE account_id=$1', [
          targetId,
        ])
      ).rows,
    ).toEqual([{ credential_version: 1 }]);
  });
  it('CSRF sai không đổi credential, không thu hồi phiên và không audit', async () => {
    expect((await reset(targetId, actor, 'wrong')).status).toBe(403);
    expect(await audit()).toEqual([]);
    expect(
      (
        await t.owner.query('SELECT credential_version FROM account_credentials WHERE account_id=$1', [
          targetId,
        ])
      ).rows,
    ).toEqual([{ credential_version: 1 }]);
    expect(
      (await t.owner.query('SELECT id FROM sessions WHERE id=$1', [targetSession.id])).rows,
    ).toHaveLength(1);
  });
  it('kiểm lại quyền sau hash: actor bị hạ vai trò không đổi credential hay audit', async () => {
    const original = t.account.hasher.hash.bind(t.account.hasher);
    const spy = vi.spyOn(t.account.hasher, 'hash').mockImplementationOnce(async (password) => {
      await t.owner.query("UPDATE accounts SET family_role='member' WHERE id=$1", [actorId]);
      return original(password);
    });
    try {
      const response = await reset();
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    } finally {
      spy.mockRestore();
    }
    expect(await audit()).toEqual([]);
    expect(
      (
        await t.owner.query('SELECT credential_version FROM account_credentials WHERE account_id=$1', [
          targetId,
        ])
      ).rows,
    ).toEqual([{ credential_version: 1 }]);
    expect(
      (await t.owner.query('SELECT id FROM sessions WHERE id=$1', [targetSession.id])).rows,
    ).toHaveLength(1);
  });
  it('Chủ hộ đặt lại cho Đồng quản lý khác trong nhà', async () => {
    await t.owner.query("UPDATE accounts SET family_role='main' WHERE id=$1", [targetId]);
    const owner = await seedSession(t.owner, ownerId);
    expect((await reset(targetId, owner)).status).toBe(200);
  });
  it('thông báo dùng actor của sự kiện mới nhất và bỏ qua loại audit khác', async () => {
    const body = resetMemberPasswordResponseSchema.parse(await (await reset()).json());
    await t.owner.query(
      `INSERT INTO admin_audit_events(id,actor_account_id,target_account_id,action,occurred_at)
      VALUES($4,$1,$3,'password_reset_by_family',now()-interval '1 day'),($5,$2,$3,'member_role_changed',now()+interval '1 second')`,
      [ownerId, ownerId, targetId, randomUUID(), randomUUID()],
    );
    expect(await (await loginTemporary(body.temporaryPassword)).json()).toMatchObject({
      session: { passwordResetBy: 'Thịnh' },
    });
  });
});
