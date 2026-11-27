import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminRequestError } from './AdminRequestError';
import type { AdminStatsRepository } from './ports';
export function useAdminStats(repository: AdminStatsRepository, accountId: string | null) {
  const client = useQueryClient();
  return useQuery({
    queryKey: ['admin', 'stats', accountId],
    enabled: Boolean(accountId),
    retry: false,
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
