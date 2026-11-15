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
    expect(await lookup(id)).toEqual({ hasLocalCredential: false });
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
    expect(await lookup(id)).toEqual({ hasLocalCredential: true });
    const after = await t.app.request('/api/me', { headers: { cookie: session.cookie } });
    expect(await after.json()).toMatchObject({ hasLocalCredential: true });
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
