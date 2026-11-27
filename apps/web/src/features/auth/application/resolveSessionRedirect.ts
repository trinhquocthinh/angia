import type { components } from '@src/shared/api/schema.gen';

export function resolveSessionRedirect(
  session: components['schemas']['MeContextResponse'] | null,
  pathname: string,
  hasPendingInvitation = false,
): '/login' | '/waiting' | '/' | '/admin' | '/invite' | null {
  if (session && pathname === '/invite') return null;
  if (
    session &&
    hasPendingInvitation &&
    ![
      '/account/change-password',
      '/account/legal-update',
      '/account/local-password',
      '/verify-email',
    ].includes(pathname)
  )
    return '/invite';
  if (
    pathname === '/account/change-password' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/verify-email'
  )
    return null;
  if (
    session &&
    (pathname === '/account' ||
      pathname === '/account/legal-update' ||
      pathname === '/account/local-password')
  )
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
