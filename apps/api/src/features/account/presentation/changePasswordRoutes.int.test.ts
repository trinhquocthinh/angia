import { seedLegalAcceptance } from '@src/shared/test/seedLegalAcceptance.js';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedSession } from '@src/shared/test/seedAuthFixtures.js';

describe('Đổi mật khẩu qua HTTP và PostgreSQL', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  let accountId: string;
  let username: string;
  let device: Awaited<ReturnType<typeof seedSession>>;
  const oldPassword = 'OldPassword123';
  const newPassword = 'NewPassword456';
  beforeAll(async () => {
    t = await startRegistrationTestApp();
  });
  afterAll(async () => {
    await t?.close();
  });
  beforeEach(async () => {
    accountId = randomUUID();
    username = accountId.slice(0, 20);
    await t.owner.query('INSERT INTO accounts(id,username_normalized,display_name) VALUES($1,$2,$3)', [
      accountId,
      username,
      'Người thử',
    ]);
    await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
      accountId,
      await t.account.hasher.hash(oldPassword),
    ]);
    await seedLegalAcceptance(t.owner, accountId);
    device = await seedSession(t.owner, accountId);
  });
  const me = (cookie = device.cookie) => t.app.request('/api/me', { headers: { cookie } });
  const change = (body: object, csrf = device.csrf) =>
    t.app.request('/api/me/password', {
      method: 'POST',
      headers: { cookie: device.cookie, 'x-csrf-token': csrf, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  const state = async () => ({
    accounts: (
      await t.owner.query('SELECT must_change_password,temp_password_expires_at FROM accounts WHERE id=$1', [
        accountId,
      ])
    ).rows,
    credentials: (await t.owner.query('SELECT * FROM account_credentials WHERE account_id=$1', [accountId]))
      .rows,
    sessions: (await t.owner.query('SELECT * FROM sessions WHERE account_id=$1 ORDER BY id', [accountId]))
      .rows,
  });
  const restrict = async () => {
    await t.owner.query(
      "UPDATE accounts SET must_change_password=true,temp_password_expires_at=now()+interval '1 hour' WHERE id=$1",
      [accountId],
    );
    await t.owner.query('UPDATE sessions SET password_change_required=true WHERE id=$1', [device.id]);
  };
  it('TC-748: phiên từ mật khẩu tạm đọc lời nhắc trả ERR_PASSWORD_CHANGE_REQUIRED', async () => {
    await restrict();
    const response = await me();
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED' } });
  });
  it('TC-749: phiên hạn chế đổi mật khẩu thành công và phiên trở về bình thường', async () => {
    await restrict();
    const before = await state();
    const response = await change({ newPassword });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const after = await state();
    expect(after.accounts).toEqual([{ must_change_password: false, temp_password_expires_at: null }]);
    expect(after.credentials[0].credential_version).toBe(2);
    // Giữ cùng phiên/CSRF; hạn có thể trượt như mọi request có phiên.
    expect(after.sessions).toEqual([
      { ...before.sessions[0], expires_at: expect.any(Date), password_change_required: false },
    ]);
    const context = await me();
    expect(context.status).toBe(200);
    expect(await context.json()).not.toHaveProperty('passwordChangeRequired');
    for (const [password, status] of [
      [newPassword, 200],
      [oldPassword, 401],
    ] as const) {
      const login = await t.app.request('/api/auth/password-login', {
        method: 'POST',
        headers: { origin: 'https://angia.example', 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      expect(login.status).toBe(status);
    }
  });
  it('TC-750: đổi mật khẩu trên thiết bị 1 thu hồi phiên thiết bị 2', async () => {
    const second = await seedSession(t.owner, accountId);
    const familyId = randomUUID();
    await t.owner.query('INSERT INTO families(id,name) VALUES($1,$2)', [familyId, 'Nhà thử']);
    await t.owner.query("UPDATE accounts SET family_id=$1,family_role='member' WHERE id=$2", [
      familyId,
      accountId,
    ]);
    await t.owner.query(
      `INSERT INTO push_subscriptions(id,family_id,account_id,last_session_id,authorized_at,endpoint,endpoint_hash,p256dh,auth)
      VALUES($6,$1,$2,$3,now(),$4,$5,'key','auth')`,
      [familyId, accountId, second.id, 'https://push.example/' + accountId, accountId, randomUUID()],
    );
    expect((await change({ currentPassword: oldPassword, newPassword })).status).toBe(204);
    expect((await me()).status).toBe(200);
    expect((await me(second.cookie)).status).toBe(401);
    expect(
      (
        await t.owner.query(
          'SELECT last_session_id,auth_method FROM push_subscriptions WHERE account_id=$1',
          [accountId],
        )
      ).rows,
    ).toEqual([{ last_session_id: null, auth_method: 'oidc' }]);
  });
  it('CSRF sai trả 403 không đổi dữ liệu', async () => {
    const before = await state();
    expect((await change({ currentPassword: oldPassword, newPassword }, 'wrong')).status).toBe(403);
    expect(await state()).toEqual(before);
  });
  it('version đổi trong lúc hash trả 401 và không ghi thêm dữ liệu', async () => {
    const original = t.account.hasher.hash.bind(t.account.hasher);
    const spy = vi.spyOn(t.account.hasher, 'hash').mockImplementationOnce(async (password) => {
      await t.owner.query(
        'UPDATE account_credentials SET credential_version=credential_version+1 WHERE account_id=$1',
        [accountId],
      );
      return original(password);
    });
    const before = await state();
    try {
      expect((await change({ currentPassword: oldPassword, newPassword })).status).toBe(401);
    } finally {
      spy.mockRestore();
    }
    const after = await state();
    expect(after).toEqual({ ...before, credentials: [{ ...before.credentials[0], credential_version: 2 }] });
  });
});
