import { hash, argon2id } from 'argon2';
import { describe, expect, it } from 'vitest';
import { createArgon2PasswordHasher } from './createArgon2PasswordHasher.js';

describe('Băm mật khẩu local', () => {
  const hasher = createArgon2PasswordHasher();

  it('TC-894 cùng mật khẩu có salt khác nhau và verify đúng/sai', async () => {
    const first = await hasher.hash('Mật khẩu thử 123');
    const second = await hasher.hash('Mật khẩu thử 123');
    expect(first).not.toBe(second);
    const parts = first.split('$');
    expect(parts.slice(1, 4)).toEqual(['argon2id', 'v=19', 'm=65536,t=3,p=1']);
    expect(Buffer.from(parts[4]!, 'base64')).toHaveLength(16);
    expect(Buffer.from(parts[5]!, 'base64')).toHaveLength(32);
    await expect(hasher.verify(first, 'Mật khẩu thử 123')).resolves.toBe(true);
    await expect(hasher.verify(first, 'Sai mật khẩu')).resolves.toBe(false);
    expect(hasher.needsRehash(first)).toBe(false);
  });

  it('TC-894 phát hiện hash theo chính sách cũ cần băm lại', async () => {
    const old = await hash('Mật khẩu thử 123', {
      type: argon2id,
      memoryCost: 65536,
      timeCost: 2,
      parallelism: 1,
      hashLength: 32,
    });
    expect(hasher.needsRehash(old)).toBe(true);
    await expect(hasher.verify(old, 'Mật khẩu thử 123')).resolves.toBe(true);
  });

  it('TC-907 (adapter) hash hỏng là lỗi hạ tầng thay vì sai mật khẩu', async () => {
    await expect(hasher.verify('hash hỏng', 'Mật khẩu thử 123')).rejects.toThrow();
  });
});
