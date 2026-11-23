import type { ReactNode } from 'react';
import { useLocation } from '@tanstack/react-router';
import { isConsentInvitationRoute } from '../application/isConsentInvitationRoute';
import { AuthBoundary } from './AuthBoundary';
export function SessionBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return isConsentInvitationRoute(pathname) || pathname === '/verify-email' ? (
    children
  ) : (
    <AuthBoundary>{children}</AuthBoundary>
  );
}
