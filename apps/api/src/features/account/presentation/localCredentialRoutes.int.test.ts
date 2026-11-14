import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';

describe('Enrollment OIDC qua HTTP và PostgreSQL', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  let accountId: string;
  let familyId: string;
  let username: string;
  let device: Awaited<ReturnType<typeof seedSession>>;
  const password = 'NewPassword123';
  beforeAll(async () => {
    t = await startRegistrationTestApp(true);
  });
  afterAll(async () => {
    await t?.close();
  });
  beforeEach(async () => {
    familyId = randomUUID();
    await t.owner.query('INSERT INTO families(id,name) VALUES($1,$2)', [familyId, 'Nhà thử']);
    accountId = await seedAccount(t.owner, { familyId, familyRole: 'member' });
    username = accountId.slice(0, 20);
    await t.owner.query('UPDATE accounts SET username_normalized=$1 WHERE id=$2', [username, accountId]);
    // Liên kết hồ sơ thật để bắt hồi quy làm mất dữ liệu khi chuyển cách đăng nhập.
    const profileId = randomUUID();
    await t.owner.query('INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,$3)', [
      profileId,
      familyId,
      'Người thử',
    ]);
    await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [profileId, accountId]);
    device = await seedSession(t.owner, accountId);
    await t.owner.query("UPDATE sessions SET oidc_auth_time=now()-interval '60 seconds' WHERE id=$1", [
      device.id,
    ]);
  });
  const enroll = (csrf = device.csrf) =>
    t.app.request('/api/me/local-credential', {
      method: 'POST',
      headers: { cookie: device.cookie, 'x-csrf-token': csrf, 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  const state = async () => ({
    count: (await t.owner.query('SELECT count(*) FROM accounts')).rows,
    account: (await t.owner.query('SELECT * FROM accounts WHERE id=$1', [accountId])).rows,
    credentials: (await t.owner.query('SELECT * FROM account_credentials WHERE account_id=$1', [accountId]))
      .rows,
  });
  const localLogin = () =>
    t.app.request('/api/auth/password-login', {
      method: 'POST',
      headers: { origin: 'https://angia.example', 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  it('TC-900: reauth OIDC đúng subject rồi thiết lập local giữ account ID và đăng nhập local được', async () => {
    const before = await state();
    const response = await enroll();
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('set-cookie')).toBeNull();
    const after = await state();
    expect(after.account).toEqual(before.account);
    expect(after.count).toEqual(before.count);
    expect(after.credentials).toHaveLength(1);
    expect(after.credentials[0]).toMatchObject({ account_id: accountId, credential_version: 1 });
    const login = await localLogin();
    expect(login.status).toBe(200);
    const cookie = login.headers.get('set-cookie')!.split(';')[0]!;
    const me = await t.app.request('/api/me', { headers: { cookie } });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({
      account: { id: accountId },
      family: { id: familyId },
      role: 'member',
    });
  });
  it('TC-751: account cũ đã thiết lập local trước cutover đăng nhập qua màn mới thành công cùng account ID và dữ liệu', async () => {
    await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
      accountId,
      await t.account.hasher.hash(password),
    ]);
    const before = await state();
    const login = await localLogin();
    expect(login.status).toBe(200);
    const cookie = login.headers.get('set-cookie')!.split(';')[0]!;
    const me = await t.app.request('/api/me', { headers: { cookie } });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({
      account: { id: accountId, healthProfileId: before.account[0].health_profile_id },
      family: { id: familyId },
      role: 'member',
    });
    expect(await state()).toEqual(before);
  });
  it.each(['null', 'old', 'local', 'subject', 'csrf'])(
    'TC-901: phiên không đủ điều kiện %s trả 403 không tạo account hoặc credential',
    async (kind) => {
      if (kind === 'null')
        await t.owner.query('UPDATE sessions SET oidc_auth_time=NULL WHERE id=$1', [device.id]);
      if (kind === 'old')
        await t.owner.query("UPDATE sessions SET oidc_auth_time=now()-interval '6 minutes' WHERE id=$1", [
          device.id,
        ]);
      if (kind === 'local')
        await t.owner.query("UPDATE sessions SET auth_method='local' WHERE id=$1", [device.id]);
      if (kind === 'subject')
        await t.owner.query('UPDATE accounts SET oidc_subject=NULL WHERE id=$1', [accountId]);
      const before = await state();
      const response = await enroll(kind === 'csrf' ? 'sai' : device.csrf);
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
      expect(await state()).toEqual(before);
    },
  );
  it('TC-902: flag tắt trả 404 không ghi dữ liệu', async () => {
    const disabled = await startRegistrationTestApp(false);
    try {
      const id = await seedAccount(disabled.owner);
      const session = await seedSession(disabled.owner, id);
      const response = await disabled.app.request('/api/me/local-credential', {
        method: 'POST',
        headers: { cookie: session.cookie, 'x-csrf-token': session.csrf, 'content-type': 'application/json' },
        body: 'JSON hỏng',
      });
      expect(response.status).toBe(404);
      expect((await disabled.owner.query('SELECT * FROM account_credentials')).rows).toEqual([]);
      expect((await disabled.owner.query('SELECT id FROM accounts')).rows).toEqual([{ id }]);
    } finally {
      await disabled.close();
    }
  });
  it('TC-902: gửi lại trả 409 giữ nguyên hash và credential_version', async () => {
    expect((await enroll()).status).toBe(204);
    const before = await state();
    const response = await enroll();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_CREDENTIAL_ALREADY_SET' } });
    expect(await state()).toEqual(before);
  });
  it('TC-902: hai yêu cầu song song chỉ chèn credential một lần', async () => {
    const responses = await Promise.all([enroll(), enroll()]);
    expect(responses.map((r) => r.status).sort()).toEqual([204, 409]);
    expect((await state()).credentials).toHaveLength(1);
    expect((await state()).credentials[0].credential_version).toBe(1);
  });
  it.each(['session', 'account', 'locked', 'subject'])(
    'TC-901: thay đổi %s trong lúc hash bị transaction chặn',
    async (kind) => {
      const original = t.account.hasher.hash.bind(t.account.hasher);
      const spy = vi.spyOn(t.account.hasher, 'hash').mockImplementationOnce(async (value) => {
        if (kind === 'session') await t.owner.query('DELETE FROM sessions WHERE id=$1', [device.id]);
        if (kind === 'account') await t.owner.query('DELETE FROM accounts WHERE id=$1', [accountId]);
        if (kind === 'locked')
          await t.owner.query('UPDATE accounts SET locked_at=now() WHERE id=$1', [accountId]);
        if (kind === 'subject')
          await t.owner.query('UPDATE accounts SET oidc_subject=NULL WHERE id=$1', [accountId]);
        return original(value);
      });
      try {
        const response = await enroll();
        expect(response.status).toBe(kind === 'account' || kind === 'session' ? 401 : 403);
        expect(await response.json()).toMatchObject({
          error: {
            code:
              kind === 'locked'
                ? 'ERR_ACCOUNT_LOCKED'
                : kind === 'subject'
                  ? 'ERR_FORBIDDEN'
                  : 'ERR_UNAUTHENTICATED',
          },
        });
        expect((await state()).credentials).toEqual([]);
      } finally {
        spy.mockRestore();
      }
    },
  );
});
