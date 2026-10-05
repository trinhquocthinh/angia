import type { Context } from 'hono';
import { setSignedCookie } from 'hono/cookie';
import type { CookieSettings } from './pendingLoginCookie.js';

const COOKIE_NAME = 'angia_session';

// Trình duyệt chỉ giữ id phiên đã ký (Tech Spec §5.1): HttpOnly, Secure, SameSite=Lax, Path=/.
export async function writeSessionCookie(
  c: Context,
  session: { sessionId: string; expiresAt: Date },
  settings: CookieSettings,
): Promise<void> {
  await setSignedCookie(c, COOKIE_NAME, session.sessionId, settings.secret, {
    path: '/',
    httpOnly: true,
    secure: settings.secure,
    sameSite: 'Lax',
    expires: session.expiresAt,
  });
}
