import { describe, expect, it, vi } from 'vitest';
import type { CredentialIdentity, PasswordHasher } from '../application/ports.js';
import { createArgon2PasswordHasher } from './createArgon2PasswordHasher.js';
import { createLocalIdentityProvider } from './createLocalIdentityProvider.js';

const identity = {
  accountId: 'account-1',
  credentialVersion: 3,
  lockedAt: null,
  mustChangePassword: false,
  tempPasswordExpiresAt: null,
};

describe('Xác thực local', () => {
  it('TC-894 trả snapshot xác thực không chứa hash hay trường account khác', async () => {
    const hasher = createArgon2PasswordHasher();
    const passwordHash = await hasher.hash('Mật khẩu thử 123');
    const findByUsername = vi.fn(async (username: string) =>
      username === 'me.lan' ? { ...identity, passwordHash, email: 'private@example.invalid' } : null,
    );
    const provider = await createLocalIdentityProvider({ findByUsername }, hasher);
    const result = await provider.verifyPassword('ME.LAN', 'Mật khẩu thử 123');
    expect(result).toEqual(identity);
    expect(findByUsername).toHaveBeenCalledWith('me.lan');
    expect(JSON.stringify(result)).not.toContain(passwordHash);
    await expect(provider.verifyPassword('me.lan', 'Sai mật khẩu')).resolves.toBeNull();
    await expect(provider.verifyPassword('khong.ton.tai', 'Mật khẩu thử 123')).resolves.toBeNull();
  });

  it('TC-895 username thiếu vẫn verify dummy hash cùng chính sách, chỉ tạo một lần', async () => {
    const hasher = createArgon2PasswordHasher();
    const hash = vi.spyOn(hasher, 'hash');
    const verify = vi.spyOn(hasher, 'verify');
    const provider = await createLocalIdentityProvider({ findByUsername: async () => null }, hasher);
    await expect(provider.verifyPassword('unknown', 'Sai mật khẩu')).resolves.toBeNull();
    await expect(provider.verifyPassword('unknown', 'Sai mật khẩu')).resolves.toBeNull();
    expect(hash).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledTimes(2);
    const dummyHash = verify.mock.calls[0]![0];
    expect(dummyHash).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=1\$/);
    expect(verify.mock.calls[1]![0]).toBe(dummyHash);
  });

  it('TC-895 không xác thực username thiếu dù dummy verify trả true', async () => {
    const hasher: PasswordHasher = {
      hash: async () => 'dummy',
      verify: async () => true,
      needsRehash: () => false,
    };
    const provider = await createLocalIdentityProvider({ findByUsername: async () => null }, hasher);
    await expect(provider.verifyPassword('unknown', 'password')).resolves.toBeNull();
  });

  it('TC-894 giữ trạng thái khoá và mật khẩu tạm trong snapshot', async () => {
    const record: CredentialIdentity = {
      ...identity,
      lockedAt: new Date('2026-11-12T01:00:00Z'),
      mustChangePassword: true,
      tempPasswordExpiresAt: new Date('2026-11-13T01:00:00Z'),
      passwordHash: 'stored-hash',
    };
    const hasher: PasswordHasher = {
      hash: async () => 'dummy',
      verify: async () => true,
      needsRehash: () => false,
    };
    const provider = await createLocalIdentityProvider({ findByUsername: async () => record }, hasher);
    const expected = {
      ...identity,
      lockedAt: record.lockedAt,
      mustChangePassword: true,
      tempPasswordExpiresAt: record.tempPasswordExpiresAt,
    };
    expect(await provider.verifyPassword('me.lan', 'password')).toEqual(expected);
  });

  it.each(['db', 'verify', 'dummy'])('TC-907 (adapter) truyền lỗi %s lên caller', async (stage) => {
    const failure = new Error('dependency unavailable');
    const hasher: PasswordHasher = {
      hash: async () => {
        if (stage === 'dummy') throw failure;
        return 'dummy';
      },
      verify: async () => {
        throw failure;
      },
      needsRehash: () => false,
    };
    const create = createLocalIdentityProvider(
      {
        findByUsername: async () => {
          if (stage === 'db') throw failure;
          return null;
        },
      },
      hasher,
    );
    if (stage === 'dummy') await expect(create).rejects.toBe(failure);
    else await expect((await create).verifyPassword('me.lan', 'password')).rejects.toBe(failure);
  });
});
