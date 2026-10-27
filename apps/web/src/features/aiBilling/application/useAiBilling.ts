import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import type { AiBillingRepository } from './ports';

export function useAiBilling(repository: AiBillingRepository, accountId: string | null) {
  const client = useQueryClient();
  return useQuery({
    queryKey: ['admin', 'ai-billing', accountId],
    enabled: Boolean(accountId),
    retry: false,
    staleTime: 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      if (!accountId) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      try {
        return await repository.get(signal);
      } catch (error) {
        if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403))
          await client.invalidateQueries({ queryKey: ['current-session'] });
        throw error;
      }
    },
  });
}
