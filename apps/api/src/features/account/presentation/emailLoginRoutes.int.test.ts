import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedLegalAcceptance } from '@src/shared/test/seedLegalAcceptance.js';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';

describe('Đăng nhập bằng email đã xác minh (SPEC-060)', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  let accountId: string;
  const password = 'StrongPassword123';
  beforeAll(async () => {
    t = await startRegistrationTestApp();
    accountId = randomUUID();
    await t.owner.query(
      "INSERT INTO accounts(id,username_normalized,display_name,email) VALUES($1,'email.login','Thử','lan@example.com')",
      [accountId],
    );
    await seedLegalAcceptance(t.owner, accountId);
    await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
      accountId,
      await t.account.hasher.hash(password),
    ]);
  });
  afterAll(async () => {
    await t?.close();
  });
  const request = (identifier: string, secret = password) =>
    t.app.request('/api/auth/password-login', {
      method: 'POST',
      headers: {
        origin: 'https://angia.example',
        'content-type': 'application/json',
        'x-test-ip': randomUUID(),
      },
      body: JSON.stringify({ identifier, password: secret }),
    });
  it('TC-924: email chưa xác minh và email thiếu đều trả lỗi chung dù mật khẩu đúng', async () => {
    const unverified = await request('lan@example.com');
    const missing = await request('missing@example.com');
    expect(unverified.status).toBe(401);
    expect(missing.status).toBe(401);
    expect(await unverified.json()).toEqual(await missing.json());
    expect(unverified.headers.get('set-cookie')).toBeNull();
    expect(missing.headers.get('set-cookie')).toBeNull();
  });
  it('TC-923: email đã xác minh không phân biệt hoa thường/khoảng trắng cấp phiên', async () => {
    await t.owner.query('UPDATE accounts SET email_verified_at=now() WHERE id=$1', [accountId]);
    const response = await request(' LAN@Example.COM ');
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(await response.json()).toMatchObject({ session: { csrfToken: expect.any(String) } });
    const wrong = await request('lan@example.com', 'wrong');
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toMatchObject({ error: { code: 'ERR_INVALID_CREDENTIALS' } });
  });
});
