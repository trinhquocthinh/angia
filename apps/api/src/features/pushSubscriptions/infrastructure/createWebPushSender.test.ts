import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWebPushSender } from './createWebPushSender.js';
const library = createRequire(import.meta.url)('web-push') as {
  sendNotification(...args: unknown[]): Promise<unknown>;
};
const value = {
  endpoint: 'https://web.push.apple.com/a',
  keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) },
};
const keys = { publicKey: 'public', privateKey: 'private', subject: 'mailto:operator@example.com' };
afterEach(() => vi.restoreAllMocks());
describe('Adapter Web Push', () => {
  it('TC-343: chỉ gửi payload mẫu; không suy ra thiết bị đã nhận từ phản hồi', async () => {
    const spy = vi.spyOn(library, 'sendNotification').mockResolvedValue({ statusCode: 201 });
    expect(await createWebPushSender(keys).send(value)).toBe('accepted');
    expect(spy.mock.calls[0]?.[1]).toBe('{"type":"test"}');
    expect(spy.mock.calls[0]?.[2]).toMatchObject({ TTL: 60, timeout: 15000 });
  });
  it('TC-349: 410 là gone; lỗi tạm là failed; URL nội bộ không gửi mạng', async () => {
    const spy = vi.spyOn(library, 'sendNotification').mockRejectedValue({ statusCode: 410 });
    expect(await createWebPushSender(keys).send(value)).toBe('gone');
    spy.mockRejectedValue({ statusCode: 503 });
    expect(await createWebPushSender(keys).send(value)).toBe('failed');
    spy.mockClear();
    expect(await createWebPushSender(keys).send({ ...value, endpoint: 'http://localhost' })).toBe('failed');
    expect(spy).not.toHaveBeenCalled();
  });
});
