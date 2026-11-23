/** Tách token đặt lại mật khẩu từ fragment URL (`#token=...`). */
export function parsePasswordResetToken(hash: string): string | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return null;
  const token = new URLSearchParams(raw).get('token')?.trim() ?? '';
  return token || null;
}
