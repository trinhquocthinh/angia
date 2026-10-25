import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { syncBrowserPush } from './syncBrowserPush';
const api = vi.hoisted(() => ({ config: vi.fn(), register: vi.fn() }));
vi.mock('./createPushApi', () => ({ createPushApi: () => api }));
vi.mock('./getPushSupport', () => ({ getPushSupport: () => null }));
const sub = { toJSON: () => ({ endpoint: 'https://web.push.apple.com/a' }), unsubscribe: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks();
  api.config.mockResolvedValue({ enabled: true });
  api.register.mockResolvedValue(undefined);
  vi.stubGlobal('Notification', { permission: 'granted' });
  vi.stubGlobal('navigator', {
    serviceWorker: {
      getRegistration: async () => ({
        scope: 'https://angia.test/',
        pushManager: { getSubscription: async () => sub },
      }),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());
describe('Đồng bộ không tự bật thông báo', () => {
  it('TC-356: chỉ gửi intent sync, không dùng intent enable khi mở app', async () => {
    const signal = new AbortController().signal;
    await syncBrowserPush('csrf', signal);
    expect(api.register).toHaveBeenCalledWith(sub.toJSON(), 'csrf', 'sync', signal);
  });
  it('TC-356: đăng ký đã bị thu hồi không tự tạo lại hoặc xin quyền', async () => {
    api.register.mockRejectedValue(Object.assign(new Error('Đã tắt'), { code: 'ERR_PUSH_NOT_REGISTERED' }));
    await expect(syncBrowserPush('csrf', new AbortController().signal)).resolves.toBeUndefined();
    expect(api.register).toHaveBeenCalledTimes(1);
    expect(sub.unsubscribe).not.toHaveBeenCalled();
  });
});
