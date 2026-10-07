import type { Context } from 'hono';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import type { CookieSettings } from './pendingLoginCookie.js';

const COOKIE_NAME = 'angia_session';
const COOKIE_PATH = '/';

// Trình duyệt chỉ giữ id phiên đã ký (Tech Spec §5.1): HttpOnly, Secure, SameSite=Lax, Path=/.
export async function writeSessionCookie(
  c: Context,
  session: { sessionId: string; expiresAt: Date },
  settings: CookieSettings,
): Promise<void> {
  await setSignedCookie(c, COOKIE_NAME, session.sessionId, settings.secret, {
    path: COOKIE_PATH,
    httpOnly: true,
    secure: settings.secure,
    sameSite: 'Lax',
    expires: session.expiresAt,
  });
}

// Id phiên khi chữ ký hợp lệ; thiếu cookie hoặc bị sửa đều trả null.
export async function readSessionId(c: Context, settings: CookieSettings): Promise<string | null> {
  const value = await getSignedCookie(c, settings.secret, COOKIE_NAME);
  return value || null;
}

export function clearSessionCookie(c: Context, settings: CookieSettings): void {
  deleteCookie(c, COOKIE_NAME, { path: COOKIE_PATH, secure: settings.secure });
}
