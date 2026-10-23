import { describe, expect, it } from 'vitest';
import { isAllowedPushSubscription } from './isAllowedPushSubscription.js';
const value = (endpoint: string) => ({ endpoint, keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) } });
describe('Kiểm tra đích Web Push', () => {
  it('TC-340: chấp nhận đúng nhà cung cấp trên HTTPS', () => {
    expect(isAllowedPushSubscription(value('https://web.push.apple.com/Q1'))).toBe(true);
    expect(isAllowedPushSubscription(value('https://fcm.googleapis.com/wp/1'))).toBe(true);
  });
  it('TC-340: chặn HTTP, host giả mạo, credential, cổng và khóa sai', () => {
    for (const url of [
      'http://web.push.apple.com/x',
      'https://127.0.0.1/x',
      'https://web.push.apple.com.evil.test/x',
      'https://u:p@web.push.apple.com/x',
      'https://web.push.apple.com:8443/x',
    ]) {
      expect(isAllowedPushSubscription(value(url))).toBe(false);
    }
    expect(
      isAllowedPushSubscription({ ...value('https://web.push.apple.com/x'), keys: { p256dh: '', auth: '' } }),
    ).toBe(false);
  });
});
