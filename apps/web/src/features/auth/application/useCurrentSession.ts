import { useQuery } from '@tanstack/react-query';
import type { components } from '@src/shared/api/schema.gen';

export type FetchCurrentSession = (
  signal?: AbortSignal,
) => Promise<components['schemas']['MeContextResponse'] | null>;

export const CURRENT_SESSION_KEY = ['current-session'] as const;

export function useCurrentSession(fetchCurrentSession: FetchCurrentSession) {
  return useQuery({
    queryKey: CURRENT_SESSION_KEY,
    queryFn: ({ signal }) => fetchCurrentSession(signal),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });
}
