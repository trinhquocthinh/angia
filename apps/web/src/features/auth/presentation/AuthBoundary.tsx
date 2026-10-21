import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { resolveSessionRedirect } from '../application/resolveSessionRedirect';
import { useCurrentSession } from '../application/useCurrentSession';
import { fetchCurrentSession } from '../infrastructure/fetchCurrentSession';
import { SessionStatus } from './components/SessionStatus';

export function AuthBoundary({ children }: { children: ReactNode }) {
  const cache = useQueryClient();
  const session = useCurrentSession(fetchCurrentSession);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pushCsrf = session.data?.family ? session.data.csrfToken : null;
  useEffect(() => {
    const controller = new AbortController();
    if (pushCsrf)
      void import('@src/features/pushSubscriptions/infrastructure/syncBrowserPush')
        .then(({ syncBrowserPush }) => syncBrowserPush(pushCsrf, controller.signal))
        .then(() => {
          if (!controller.signal.aborted)
            void cache.invalidateQueries({ queryKey: ['push-config', pushCsrf] });
        })
        .catch(() => undefined);
    return () => controller.abort();
  }, [pushCsrf, cache]);
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
