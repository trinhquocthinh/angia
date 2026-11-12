import { describe, expect, it } from 'vitest';
import { createFakeIdentityProvider } from './createFakeIdentityProvider.js';

describe('Fake xác thực local', () => {
  const identity = {
    accountId: 'account-1',
    credentialVersion: 2,
    lockedAt: null,
    mustChangePassword: true,
    tempPasswordExpiresAt: new Date('2026-11-13T01:00:00Z'),
  };

  it('TC-894 fake trả snapshot cùng contract, không lộ mật khẩu fixture', async () => {
    const provider = createFakeIdentityProvider([{ username: 'me.lan', password: 'password', identity }]);
    const result = await provider.verifyPassword('ME.LAN', 'password');
    expect(result).toEqual(identity);
    expect(result).not.toBe(identity);
    expect(JSON.stringify(result)).not.toContain('password');
    result!.tempPasswordExpiresAt!.setTime(0);
    expect(await provider.verifyPassword('me.lan', 'password')).toEqual(identity);
  });

  it('TC-895 fake trả cùng null cho sai mật khẩu và username không tồn tại', async () => {
    const provider = createFakeIdentityProvider([{ username: 'me.lan', password: 'password', identity }]);
    await expect(provider.verifyPassword('me.lan', 'wrong')).resolves.toBeNull();
    await expect(provider.verifyPassword('unknown', 'password')).resolves.toBeNull();
    await expect(createFakeIdentityProvider().verifyPassword('unknown', 'password')).resolves.toBeNull();
  });
});
