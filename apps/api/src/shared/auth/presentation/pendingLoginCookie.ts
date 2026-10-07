import type { Context } from 'hono';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import { z } from 'zod';
import type { PendingLogin } from '../application/ports.js';

const COOKIE_NAME = 'angia_oidc';
const COOKIE_PATH = '/api/auth';
const MAX_AGE_SECONDS = 10 * 60;

const pendingLoginSchema = z.object({
  state: z.string().min(1),
  codeVerifier: z.string().min(1),
  nonce: z.string().min(1),
});

export interface CookieSettings {
  secret: string;
  secure: boolean;
}

// Cookie ký HMAC, HttpOnly, chỉ gửi về /api/auth và sống 10 phút; SameSite=Lax để theo redirect từ Authentik.
export async function writePendingLogin(
  c: Context,
  pending: PendingLogin,
  settings: CookieSettings,
): Promise<void> {
  await setSignedCookie(c, COOKIE_NAME, JSON.stringify(pending), settings.secret, {
    path: COOKIE_PATH,
    httpOnly: true,
    secure: settings.secure,
    sameSite: 'Lax',
    maxAge: MAX_AGE_SECONDS,
  });
}

// Đọc rồi xóa ngay (dùng một lần); chữ ký sai, thiếu hay hỏng định dạng đều trả null.
export async function takePendingLogin(c: Context, settings: CookieSettings): Promise<PendingLogin | null> {
  const raw = await getSignedCookie(c, settings.secret, COOKIE_NAME);
  deleteCookie(c, COOKIE_NAME, { path: COOKIE_PATH, secure: settings.secure });
  if (!raw) {
    return null;
  }
  try {
    const parsed = pendingLoginSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
