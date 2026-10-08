import { describe, expect, it } from 'vitest';
import { privacyPollInterval } from './privacyPolling';
describe('Hỏi lại bản nháp riêng tư', () => {
  it('TC-215: chỉ hỏi lại khi đang tạo ảnh, không hỏi lại sau thành công hoặc lỗi', () => {
    expect(privacyPollInterval({ state: 'pending', draftId: 'd' })).toBe(3000);
    expect(privacyPollInterval({ state: 'failed', draftId: 'd' })).toBe(false);
    expect(privacyPollInterval({ state: 'none' })).toBe(false);
    expect(privacyPollInterval(undefined)).toBe(false);
    expect(
      privacyPollInterval({ state: 'ready', draftId: 'd', sha256: 'a'.repeat(64), imageUrl: '/image' }),
    ).toBe(false);
  });
});
