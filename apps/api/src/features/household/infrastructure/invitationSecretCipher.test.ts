import { expect, it } from 'vitest';
import { createInvitationSecretCipher } from './invitationSecretCipher.js';
it('TC-773: mã hóa ngẫu nhiên, khôi phục đúng và từ chối đổi nhà/ID/khóa hoặc sửa ciphertext', () => {
  const cipher = createInvitationSecretCipher('a'.repeat(48));
  const value = { token: 'token thử', code: 'ABCDEF123456' };
  const sealed = cipher.seal('nhà', 'id', value);
  expect(sealed).not.toContain(value.code);
  expect(cipher.seal('nhà', 'id', value)).not.toBe(sealed);
  expect(cipher.open('nhà', 'id', sealed)).toEqual(value);
  for (const action of [
    () => cipher.open('khác', 'id', sealed),
    () => cipher.open('nhà', 'khác', sealed),
    () => createInvitationSecretCipher('b'.repeat(48)).open('nhà', 'id', sealed),
    () => cipher.open('nhà', 'id', sealed.slice(0, -4) + 'AAAA'),
  ])
    expect(action).toThrow();
  expect(() => createInvitationSecretCipher('')).toThrow();
});
