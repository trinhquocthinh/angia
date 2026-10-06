export function readInvitationToken(hash: string): string | null {
  if (!hash.startsWith('#')) return null;
  const values = new URLSearchParams(hash.slice(1)).getAll('token');
  const token = values[0];
  return values.length === 1 && token && token.length <= 2048 && /^v1\.[A-Za-z0-9_-]+$/.test(token)
    ? token
    : null;
}
