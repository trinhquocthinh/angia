import type { components } from '@src/shared/api/schema.gen';

export function resolveSessionRedirect(
  session: components['schemas']['MeContextResponse'] | null,
  pathname: string,
): '/login' | '/waiting' | '/' | null {
  if (!session) return pathname === '/login' ? null : '/login';
  if (!session.family) return pathname === '/waiting' ? null : '/waiting';
  if (pathname === '/login' || pathname === '/waiting') return '/';
  return null;
}
