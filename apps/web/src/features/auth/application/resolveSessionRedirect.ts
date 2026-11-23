import type { components } from '@src/shared/api/schema.gen';

export function resolveSessionRedirect(
  session: components['schemas']['MeContextResponse'] | null,
  pathname: string,
): '/login' | '/waiting' | '/' | '/admin' | null {
  if (pathname === '/account/change-password' || pathname === '/forgot-password') return null;
  if (session && (pathname === '/account/legal-update' || pathname === '/account/local-password'))
    return null;
  const isAccountRoute = pathname === '/login' || pathname === '/register';
  if (!session) return isAccountRoute ? null : '/login';
  if (pathname === '/admin') {
    if (session.account.isSystemAdmin) return null;
    return session.family ? '/' : '/waiting';
  }
  if (session.account.isSystemAdmin && (!session.family || isAccountRoute || pathname === '/waiting')) {
    return '/admin';
  }
  if (!session.family) return pathname === '/waiting' ? null : '/waiting';
  if (isAccountRoute || pathname === '/waiting') return '/';
  return null;
}
