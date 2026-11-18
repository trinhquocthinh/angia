export function invitationIsExpired(expiresAt: string, now: number): boolean {
  const expires = Date.parse(expiresAt);
  return !Number.isFinite(expires) || now >= expires;
}
