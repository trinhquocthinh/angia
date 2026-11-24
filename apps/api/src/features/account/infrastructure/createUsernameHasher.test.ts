import { describe, expect, it } from 'vitest';
import { createUsernameHasher } from './createUsernameHasher.js';

describe('Băm tên đăng nhập đã xoá (SPEC-073)', () => {
  it('TC-827: HMAC-SHA256 ổn định và không chứa tên đăng nhập', () => {
    const hash = createUsernameHasher('a'.repeat(48));
    expect(hash('me.lan')).toMatch(/^[a-f0-9]{64}$/);
    expect(hash('me.lan')).toBe(hash('me.lan'));
    expect(hash('me.lan')).not.toContain('me.lan');
  });
  it('TC-827: khóa khác cho kết quả khác', () => {
    expect(createUsernameHasher('a'.repeat(48))('me.lan')).not.toBe(
      createUsernameHasher('b'.repeat(48))('me.lan'),
    );
  });
});
