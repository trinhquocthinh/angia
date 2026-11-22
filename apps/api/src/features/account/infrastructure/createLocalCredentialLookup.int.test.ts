import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { createLocalCredentialLookup } from './createLocalCredentialLookup.js';

describe('Ngữ cảnh enrollment qua role app và HTTP', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  beforeAll(async () => {
    t = await startRegistrationTestApp(true);
  });
  afterAll(async () => {
    await t?.close();
  });

  it('TC-900: account OIDC chưa có credential trả false rồi trả true sau thiết lập', async () => {
    const id = await seedAccount(t.owner);
    const session = await seedSession(t.owner, id);
    const lookup = createLocalCredentialLookup(createDatabase(t.pool));
    expect(await lookup(id)).toEqual({
      hasLocalCredential: false,
      email: null,
      emailVerified: false,
      pendingEmail: null,
    });
    const before = await t.app.request('/api/me', { headers: { cookie: session.cookie } });
    expect(before.status).toBe(200);
    expect(before.headers.get('cache-control')).toBe('no-store');
    expect(await before.json()).toMatchObject({
      authMethod: 'oidc',
      hasLocalCredential: false,
      features: { localEnrollmentEnabled: true },
    });
    await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
      id,
      await t.account.hasher.hash('NewPassword123'),
    ]);
    expect(await lookup(id)).toEqual({
      hasLocalCredential: true,
      email: null,
      emailVerified: false,
      pendingEmail: null,
    });
    const after = await t.app.request('/api/me', { headers: { cookie: session.cookie } });
    expect(await after.json()).toMatchObject({ hasLocalCredential: true });
  });

  it.each([
    { label: 'chưa có email', email: null, emailVerified: false, pendingEmail: null },
    { label: 'chưa xác minh', email: 'unverified@example.test', emailVerified: false, pendingEmail: null },
    {
      label: 'đã xác minh và có email chờ',
      email: 'verified@example.test',
      emailVerified: true,
      pendingEmail: 'pending@example.test',
    },
  ])('/api/me trả trạng thái email mới nhất khi $label', async ({ label: _label, ...emailStatus }) => {
    const id = await seedAccount(t.owner);
    const session = await seedSession(t.owner, id);
    await t.owner.query('UPDATE accounts SET email=$2, email_verified_at=$3, pending_email=$4 WHERE id=$1', [
      id,
      emailStatus.email,
      emailStatus.emailVerified ? new Date() : null,
      emailStatus.pendingEmail,
    ]);
    const response = await t.app.request('/api/me', { headers: { cookie: session.cookie } });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ emailStatus });
    await t.owner.query('UPDATE accounts SET email_verified_at=NULL, pending_email=NULL WHERE id=$1', [id]);
    const refreshed = await t.app.request('/api/me', { headers: { cookie: session.cookie } });
    expect(await refreshed.json()).toMatchObject({
      emailStatus: { email: emailStatus.email, emailVerified: false, pendingEmail: null },
    });
  });

  it('TC-902: cờ enrollment tắt phản ánh qua /api/me', async () => {
    // App đóng cấu hình tại lúc lắp route; instance riêng kiểm chứng cờ tắt.
    const disabled = await startRegistrationTestApp(false);
    try {
      const id = await seedAccount(disabled.owner);
      const session = await seedSession(disabled.owner, id);
      const response = await disabled.app.request('/api/me', { headers: { cookie: session.cookie } });
      expect(await response.json()).toMatchObject({ features: { localEnrollmentEnabled: false } });
    } finally {
      await disabled.close();
    }
  });
});
