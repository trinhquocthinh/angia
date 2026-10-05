import { useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { resolveSessionRedirect } from '../application/resolveSessionRedirect';
import { useCurrentSession } from '../application/useCurrentSession';
import { fetchCurrentSession } from '../infrastructure/fetchCurrentSession';
import { SessionStatus } from './components/SessionStatus';

export function AuthBoundary({ children }: { children: ReactNode }) {
  const session = useCurrentSession(fetchCurrentSession);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const destination = session.isSuccess ? resolveSessionRedirect(session.data, pathname) : null;

  useEffect(() => {
    if (destination) void navigate({ to: destination, replace: true });
  }, [destination, navigate]);

  if (session.isPending || (session.isError && session.isFetching) || destination) {
    return <SessionStatus state="loading" />;
  }
  if (session.isError) {
    return <SessionStatus state="error" onRetry={() => void session.refetch()} />;
  }
  return children;
}
