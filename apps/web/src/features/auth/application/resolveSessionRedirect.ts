import type { components } from '@src/shared/api/schema.gen';

export function resolveSessionRedirect(
  session: components['schemas']['MeContextResponse'] | null,
  pathname: string,
): '/login' | '/waiting' | '/' | '/admin' | null {
  if (!session) return pathname === '/login' ? null : '/login';
  if (pathname === '/admin') {
    if (session.account.isSystemAdmin) return null;
    return session.family ? '/' : '/waiting';
  }
  if (
    session.account.isSystemAdmin &&
    (!session.family || pathname === '/login' || pathname === '/waiting')
  ) {
    return '/admin';
  }
  if (!session.family) return pathname === '/waiting' ? null : '/waiting';
  if (pathname === '/login' || pathname === '/waiting') return '/';
  return null;
}
