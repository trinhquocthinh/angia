import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createRateLimitKeyHasher } from './createRateLimitKeyHasher.js';

describe('Khoá HMAC bảo vệ IP và username', () => {
  it('dùng HMAC-SHA256 hex với secret tiêm vào và kind', () => {
    const hash = createRateLimitKeyHasher('secret');
    expect(hash('register', '192.0.2.1')).toBe(
      createHmac('sha256', 'secret').update('register:192.0.2.1').digest('hex'),
    );
    expect(hash('register', '192.0.2.1')).not.toBe(
      createRateLimitKeyHasher('other')('register', '192.0.2.1'),
    );
  });
  it('TC-845: chuẩn hoá username, phân biệt IP/username và không nhập nhằng phần khoá', () => {
    const hash = createRateLimitKeyHasher('secret');
    expect(hash('login_failed', { ip: 'ip', username: 'Me.Lan' })).toBe(
      hash('login_failed', { ip: 'ip', username: 'me.lan' }),
    );
    expect(hash('login_failed', { ip: 'a:b', username: 'c' })).not.toBe(
      hash('login_failed', { ip: 'a', username: 'b:c' }),
    );
  });
});
