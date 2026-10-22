import { afterEach, describe, expect, it, vi } from 'vitest';
import { enableBrowserPush } from './enableBrowserPush';
import { disableBrowserPush } from './disableBrowserPush';
import type { PushApi } from '../application/ports';
afterEach(() => vi.unstubAllGlobals());
function setup() {
  const events: string[] = [];
  const intents: string[] = [];
  const sub = {
    toJSON: () => ({ endpoint: 'https://web.push.apple.com/a', keys: { auth: 'a', p256dh: 'b' } }),
    unsubscribe: async () => {
      events.push('unsubscribe');
      return true;
    },
  };
  const reg = {
    active: {},
    scope: 'https://angia.test/',
    pushManager: { getSubscription: async () => sub },
    getNotifications: async () => [],
  };
  vi.stubGlobal('navigator', {
    serviceWorker: { register: async () => reg, getRegistration: async () => reg },
  });
  vi.stubGlobal('Notification', {
    requestPermission: async () => {
      events.push('permission');
      return 'granted';
    },
  });
  const api: PushApi = {
    config: async () => ({ enabled: true, publicKey: 'key', registered: false }),
    register: async (_value, _csrf, intent) => {
      intents.push(intent);
      events.push('register');
    },
    remove: async () => {
      events.push('remove');
    },
    sendTest: async () => undefined,
  };
  return { api, events, intents };
}
describe('Bật/tắt Web Push trên trình duyệt', () => {
  it('TC-348: xin quyền trước, tự gửi đăng ký về AN GIA', async () => {
    const { api, events, intents } = setup();
    await enableBrowserPush(api, 'public', 'csrf');
    expect(events).toEqual(['permission', 'register']);
    expect(intents).toEqual(['enable']);
  });
  it('TC-349: xung đột chủ sở hữu gỡ đăng ký browser thay vì chuyển quyền', async () => {
    const { api, events } = setup();
    api.register = async () => {
      throw Object.assign(new Error('Xung đột'), { code: 'ERR_PUSH_CONFLICT' });
    };
    await expect(enableBrowserPush(api, 'public', 'csrf')).rejects.toThrow('Xung đột');
    expect(events).toEqual(['permission', 'unsubscribe']);
  });
  it('TC-349: tắt server trước rồi unsubscribe browser', async () => {
    const { api, events } = setup();
    await disableBrowserPush(api, 'csrf');
    expect(events).toEqual(['remove', 'unsubscribe']);
  });
  it('TC-349: tắt server lỗi thì không giả lập đã tắt trên browser', async () => {
    const { api, events } = setup();
    api.remove = async () => {
      throw new Error('Mất mạng');
    };
    await expect(disableBrowserPush(api, 'csrf')).rejects.toThrow('Mất mạng');
    expect(events).toEqual([]);
  });
});
