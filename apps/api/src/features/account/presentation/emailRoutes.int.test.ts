import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedLegalAcceptance } from '@src/shared/test/seedLegalAcceptance.js';
import { seedSession } from '@src/shared/test/seedAuthFixtures.js';

describe('SPEC-085: đổi và xác minh email qua HTTP/PostgreSQL', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  let accountId: string;
  let device: Awaited<ReturnType<typeof seedSession>>;
  const password = 'StrongPassword123';
  beforeAll(async () => {
    t = await startRegistrationTestApp();
  });
  afterAll(async () => {
    await t?.close();
  });
  beforeEach(async () => {
    accountId = randomUUID();
    await t.owner.query('INSERT INTO accounts(id,username_normalized,display_name) VALUES($1,$2,$3)', [
      accountId,
      accountId.slice(0, 20),
      'Người thử',
    ]);
    await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
      accountId,
      await t.account.hasher.hash(password),
    ]);
    await seedLegalAcceptance(t.owner, accountId);
    device = await seedSession(t.owner, accountId);
  });
  const request = (path: string, method: string, body?: object) =>
    t.app.request(path, {
      method,
      headers: { cookie: device.cookie, 'x-csrf-token': device.csrf, 'content-type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const change = (email: string, currentPassword = password) =>
    request('/api/me/email', 'PATCH', { email, currentPassword });
  const send = () => request('/api/me/email-verifications', 'POST');
  const state = async () =>
    (
      await t.owner.query('SELECT email,email_verified_at,pending_email FROM accounts WHERE id=$1', [
        accountId,
      ])
    ).rows[0];
  const jobs = async () =>
    (
      await t.owner.query(
        "SELECT data FROM pgboss.job WHERE name='send-transactional-email' AND data->>'to'=$1",
        [`${accountId}@example.com`],
      )
    ).rows;
  const setEmail = (verified = false) =>
    t.owner.query('UPDATE accounts SET email=$2,email_verified_at=$3 WHERE id=$1', [
      accountId,
      `${accountId}@example.com`,
      verified ? new Date() : null,
    ]);
  const confirm = (token: string) =>
    t.app.request('/api/auth/email-verifications/confirm', {
      method: 'POST',
      headers: { origin: 'https://angia.example', 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  it('TC-927: sai mật khẩu trả 401 và email không đổi', async () => {
    await setEmail();
    const before = await state();
    const response = await change('new@example.com', 'wrong');
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_INVALID_CREDENTIALS' } });
    expect(await state()).toEqual(before);
    expect(await jobs()).toEqual([]);
  });
  it.each([false, true])(
    'TC-932: chưa có/chưa xác minh thay email trực tiếp, không gửi mail (%s)',
    async (hasEmail) => {
      if (hasEmail) await setEmail();
      const response = await change(`  ${accountId.toUpperCase()}@EXAMPLE.COM  `);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        email: `${accountId}@example.com`,
        emailVerified: false,
        pendingEmail: null,
      });
      expect(await state()).toEqual({
        email: `${accountId}@example.com`,
        email_verified_at: null,
        pending_email: null,
      });
      expect(await jobs()).toEqual([]);
    },
  );
  it('TC-928: email đã xác minh giữ nguyên khi đặt hoặc huỷ pending_email, không gửi mail', async () => {
    await setEmail(true);
    const before = await state();
    const response = await change('new@example.com');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      email: before.email,
      emailVerified: true,
      pendingEmail: 'new@example.com',
    });
    expect(await state()).toEqual({ ...before, pending_email: 'new@example.com' });
    for (const [identifier, status] of [
      [before.email, 200],
      ['new@example.com', 401],
    ] as const) {
      const login = await t.app.request('/api/auth/password-login', {
        method: 'POST',
        headers: { origin: 'https://angia.example', 'content-type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      expect(login.status).toBe(status);
    }
    expect(await jobs()).toEqual([]);
    expect((await change(before.email)).status).toBe(200);
    expect(await state()).toEqual(before);
    // Nhận link đặt lại mật khẩu thuộc E29-S1-T3.
  });
  it('TC-925: gửi đúng một job rồi xác nhận công khai không cần phiên', async () => {
    await setEmail();
    const response = await send();
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ sent: true });
    const queued = await jobs();
    expect(queued).toHaveLength(1);
    expect(queued[0].data).toMatchObject({
      to: `${accountId}@example.com`,
      subject: 'Xác minh email AN GIA',
    });
    const token = /#token=([A-Za-z0-9_-]+)/.exec(queued[0].data.text)?.[1];
    expect(token).toBeTruthy();
    expect((await confirm(token!)).status).toBe(204);
    expect((await state()).email_verified_at).toBeInstanceOf(Date);
    const stored = (
      await t.owner.query('SELECT token_hash,used_at FROM email_verification_tokens WHERE account_id=$1', [
        accountId,
      ])
    ).rows;
    expect(stored).toHaveLength(1);
    expect(stored[0].token_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored[0].token_hash).not.toBe(token);
    expect(stored[0].used_at).toBeInstanceOf(Date);
  });
  it('TC-930: lượt gửi thứ tư bị chặn và có Retry-After', async () => {
    await setEmail();
    for (let i = 0; i < 3; i++) expect((await send()).status).toBe(202);
    const response = await send();
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_RATE_LIMITED' } });
    expect(response.headers.get('retry-after')).toMatch(/^[1-9][0-9]*$/);
    expect(await jobs()).toHaveLength(3);
  });
  it('TC-930: 204 và lỗi thiếu email không tiêu lượt gửi', async () => {
    for (let i = 0; i < 4; i++) expect((await send()).status).toBe(422);
    await setEmail(true);
    for (let i = 0; i < 4; i++) expect((await send()).status).toBe(204);
    expect(await jobs()).toEqual([]);
    await t.owner.query('UPDATE accounts SET email_verified_at=NULL WHERE id=$1', [accountId]);
    for (let i = 0; i < 3; i++) expect((await send()).status).toBe(202);
    expect((await send()).status).toBe(429);
  });
  it('TC-926: token rác trả 400 cùng thông điệp chuẩn và no-store', async () => {
    const response = await confirm('token-rac');
    expect(response.status).toBe(400);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      error: {
        code: 'ERR_VERIFICATION_TOKEN_INVALID',
        message: 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.',
      },
    });
  });
});
