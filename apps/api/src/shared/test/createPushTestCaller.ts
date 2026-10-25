import type { ProfileTestApp } from './startProfileTestApp.js';
import type { SeededSession } from './seedAuthFixtures.js';

// Mỗi session trong fixture đại diện một browser riêng; giữ cookie thiết bị như browser thật.
export function createPushTestCaller(getApp: () => ProfileTestApp) {
  const devices = new Map<string, string>();
  return async (user: SeededSession, method: string, path: string, body?: unknown) => {
    const requestBody =
      method === 'PUT' && path === '/api/me/push-subscription'
        ? { intent: 'enable', ...(body as object) }
        : body;
    const cookie = devices.get(user.id);
    const response = await getApp().call(
      { ...user, cookie: user.cookie + (cookie ? `; ${cookie}` : '') },
      method,
      path,
      requestBody,
    );
    for (const header of response.headers.getSetCookie()) {
      if (header.startsWith('angia_push_device=')) devices.set(user.id, header.split(';')[0]!);
    }
    return response;
  };
}
