import { passwordLoginResponseSchema } from '@angia/contracts';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordHashBusyError } from '@src/shared/identity/application/PasswordHashBusyError.js';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';

describe('POST /api/auth/password-login (SPEC-060)', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  let ip: string;
  let accountId: string;
  const password = 'StrongPassword123';
  beforeAll(async () => {
    t = await startRegistrationTestApp();
    accountId = randomUUID();
    await t.owner.query(
      "INSERT INTO accounts(id,username_normalized,display_name) VALUES($1,'me.lan','Mẹ Lan')",
      [accountId],
    );
    await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
      accountId,
      await t.account.hasher.hash(password),
    ]);
  });
  beforeEach(() => {
    ip = randomUUID();
  });
  afterAll(async () => {
    await t?.close();
  });
  const request = (username = 'Me.Lan', secret = password) =>
    t.app.request('/api/auth/password-login', {
      method: 'POST',
      headers: {
        origin: 'https://angia.example',
        'content-type': 'application/json',
        'x-test-ip': ip,
      },
      body: JSON.stringify({ username, password: secret }),
    });
  const count = async () => (await t.pool.query('SELECT id FROM sessions')).rowCount;
  it('TC-744: mật khẩu đúng trả cookie/CSRF/30 ngày và ghi phiên local', async () => {
    const before = Date.now();
    const response = await request();
    expect(response.status).toBe(200);
    const body = passwordLoginResponseSchema.parse(await response.json());
    expect(body).toEqual({
      session: {
        csrfToken: expect.any(String),
        expiresAt: expect.any(String),
        passwordChangeRequired: false,
      },
    });
    expect(Date.parse(body.session.expiresAt) - before).toBeGreaterThanOrEqual(30 * 86400000);
    expect(Date.parse(body.session.expiresAt) - Date.now()).toBeLessThanOrEqual(30 * 86400000);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const cookie = response.headers.get('set-cookie')!;
    expect(cookie).toContain('HttpOnly; SameSite=Lax');
    const me = await t.app.request('/api/me', { headers: { cookie: cookie.split(';')[0]! } });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ csrfToken: body.session.csrfToken });
    expect(
      (
        await t.pool.query('SELECT auth_method,password_change_required FROM sessions WHERE csrf_token=$1', [
          body.session.csrfToken,
        ])
      ).rows,
    ).toEqual([{ auth_method: 'local', password_change_required: false }]);
  });
  it('TC-745/746: sai mật khẩu và username không tồn tại cùng code/message', async () => {
    const before = await count();
    const wrong = await request('Me.Lan', 'wrong');
    const missing = await request('missing', 'wrong');
    expect(wrong.status).toBe(401);
    expect(missing.status).toBe(401);
    expect(await wrong.json()).toEqual({
      error: {
        code: 'ERR_INVALID_CREDENTIALS',
        message: 'Tên đăng nhập hoặc mật khẩu chưa đúng.',
      },
    });
    expect(await missing.json()).toEqual({
      error: {
        code: 'ERR_INVALID_CREDENTIALS',
        message: 'Tên đăng nhập hoặc mật khẩu chưa đúng.',
      },
    });
    expect(wrong.headers.get('set-cookie')).toBeNull();
    expect(missing.headers.get('set-cookie')).toBeNull();
    expect(await count()).toBe(before);
  });
  it('account chỉ OIDC không có credential cũng trả invalid credentials', async () => {
    await t.owner.query(
      "INSERT INTO accounts(id,oidc_subject,username_normalized,display_name) VALUES($1,$2,'oidc.only','Thử')",
      [randomUUID(), randomUUID()],
    );
    expect((await request('oidc.only')).status).toBe(401);
  });
  it('TC-747: khoá account trả 403 và không cookie/phiên', async () => {
    const before = await count();
    await t.owner.query('UPDATE accounts SET locked_at=now() WHERE id=$1', [accountId]);
    try {
      const response = await request();
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: {
          code: 'ERR_ACCOUNT_LOCKED',
          message: 'Tài khoản đang bị khoá. Liên hệ quản trị.',
        },
      });
      expect(response.headers.get('set-cookie')).toBeNull();
      expect(await count()).toBe(before);
    } finally {
      await t.owner.query('UPDATE accounts SET locked_at=NULL WHERE id=$1', [accountId]);
    }
  });
  it('mật khẩu tạm còn hạn ghi cờ, hết hạn trả 401 không phiên', async () => {
    await t.owner.query(
      "UPDATE accounts SET must_change_password=true,temp_password_expires_at=now()+interval '1 hour' WHERE id=$1",
      [accountId],
    );
    try {
      const response = await request();
      expect(response.status).toBe(200);
      const body = passwordLoginResponseSchema.parse(await response.json());
      expect(body.session.passwordChangeRequired).toBe(true);
      expect(
        (
          await t.pool.query('SELECT password_change_required FROM sessions WHERE csrf_token=$1', [
            body.session.csrfToken,
          ])
        ).rows,
      ).toEqual([{ password_change_required: true }]);
      const before = await count();
      await t.owner.query(
        "UPDATE accounts SET temp_password_expires_at=now()-interval '1 second' WHERE id=$1",
        [accountId],
      );
      const expired = await request();
      expect(expired.status).toBe(401);
      expect(expired.headers.get('set-cookie')).toBeNull();
      expect(await count()).toBe(before);
    } finally {
      await t.owner.query(
        'UPDATE accounts SET must_change_password=false,temp_password_expires_at=NULL WHERE id=$1',
        [accountId],
      );
    }
  });
  it('TC-845: lần sai thứ 11 trả 429/Retry-After, khoá username chữ thường và IP', async () => {
    for (let i = 0; i < 10; i++)
      expect((await request(i % 2 ? 'ME.LAN' : 'me.lan', 'wrong')).status).toBe(401);
    const response = await request();
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_RATE_LIMITED' } });
    expect(response.headers.get('retry-after')).toMatch(/^[1-9][0-9]*$/);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect((await request('other.username', 'wrong')).status).toBe(401);
    ip = randomUUID();
    expect((await request()).status).toBe(200);
  });
  it.each(['busy', 'hash', 'db', 'timeout', 'insert', 'hit'])(
    'TC-907: lỗi %s trả 503, không cookie và không phiên',
    async (stage) => {
      const before = await count();
      const error = stage === 'busy' ? new PasswordHashBusyError() : new Error('timeout/DB/hash');
      const spy =
        stage === 'db'
          ? vi.spyOn(t.account.rateLimit.store, 'read').mockRejectedValueOnce(error)
          : stage === 'insert'
            ? vi.spyOn(t.account.localLoginSessions, 'createIfCurrent').mockRejectedValueOnce(error)
            : stage === 'hit'
              ? vi.spyOn(t.account.rateLimit.store, 'increment').mockRejectedValueOnce(error)
              : vi.spyOn(t.account.hasher, 'verify').mockRejectedValueOnce(error);
      try {
        const response = await request('Me.Lan', stage === 'hit' ? 'wrong' : password);
        expect(response.status).toBe(503);
        expect(await response.json()).toMatchObject({ error: { code: 'ERR_AUTH_UNAVAILABLE' } });
        expect(response.headers.get('set-cookie')).toBeNull();
        expect(await count()).toBe(before);
      } finally {
        spy.mockRestore();
      }
    },
  );
});
