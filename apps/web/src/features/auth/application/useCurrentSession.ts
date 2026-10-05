import { useQuery } from '@tanstack/react-query';
import type { components } from '@src/shared/api/schema.gen';

export type FetchCurrentSession = (
  signal?: AbortSignal,
) => Promise<components['schemas']['MeContextResponse'] | null>;

export function useCurrentSession(fetchCurrentSession: FetchCurrentSession) {
  return useQuery({
    queryKey: ['current-session'],
    queryFn: ({ signal }) => fetchCurrentSession(signal),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });
}
