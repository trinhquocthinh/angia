let pending: string | null = null;

export function capturePendingInvitation(
  location: Pick<Location, 'pathname' | 'search' | 'hash'>,
  history: Pick<History, 'state' | 'replaceState'>,
): void {
  if (location.pathname !== '/invite') return;
  const tokens = new URLSearchParams(location.hash.replace(/^#/, '')).getAll('token');
  pending = tokens.length === 1 && /^[A-Za-z0-9_-]{43}$/.test(tokens[0] ?? '') ? tokens[0]! : null;
  history.replaceState(history.state, '', `/invite${location.search}`);
}

export function readPendingInvitation(): string | null {
  return pending;
}

export function clearPendingInvitation(): void {
  pending = null;
}
