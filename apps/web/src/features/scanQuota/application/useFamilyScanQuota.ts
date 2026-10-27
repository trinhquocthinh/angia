import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { refreshQuotaSession } from './refreshQuotaSession';
import type { ScanQuotaRepository } from './ports';
export function useFamilyScanQuota(
  repository: ScanQuotaRepository,
  accountId: string | null,
  familyId: string | null,
) {
  const client = useQueryClient();
  return useQuery({
    queryKey: ['family', 'scan-quota', accountId, familyId],
    enabled: Boolean(accountId && familyId),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!accountId || !familyId) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      try {
        return await repository.getFamily(signal);
      } catch (error) {
        await refreshQuotaSession(error, client);
        throw error;
      }
    },
  });
}
