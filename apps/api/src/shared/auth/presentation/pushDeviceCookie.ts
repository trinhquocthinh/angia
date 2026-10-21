import type { Context } from 'hono';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import type { CookieSettings } from './pendingLoginCookie.js';
const NAME = 'angia_push_device';
const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

// Chỉ nhận diện thiết bị; cookie này không xác thực tài khoản hoặc gia hạn phiên.
export async function readPushDevice(c: Context, settings: CookieSettings): Promise<string | null> {
  const id = await getSignedCookie(c, settings.secret, NAME);
  return id && UUID.test(id) ? id : null;
}
export async function writePushDevice(c: Context, id: string, settings: CookieSettings): Promise<void> {
  await setSignedCookie(c, NAME, id, settings.secret, {
    path: '/api',
    httpOnly: true,
    secure: settings.secure,
    sameSite: 'Lax',
    maxAge: 365 * 86400,
  });
}
export function clearPushDevice(c: Context, settings: CookieSettings): void {
  deleteCookie(c, NAME, { path: '/api', secure: settings.secure });
}
