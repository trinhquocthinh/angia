import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GrantScanQuotasRequest } from '@angia/contracts';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { refreshQuotaSession } from './refreshQuotaSession';
import { useScanQuotaMutation } from './useScanQuotaMutation';
import type { ScanQuotaRepository } from './ports';
export function useAdminScanQuota(
  repository: ScanQuotaRepository,
  csrfToken: string | null,
  accountId: string | null,
) {
  const client = useQueryClient();
  const config = useQuery({
    queryKey: ['admin', 'scan-quotas', accountId],
    enabled: Boolean(csrfToken && accountId),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async ({ signal }) => {
      if (!csrfToken || !accountId) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      try {
        return await repository.getAdmin(signal);
      } catch (error) {
        await refreshQuotaSession(error, client);
        throw error;
      }
    },
  });
  const write = useScanQuotaMutation(repository);
  const ownsWrite = write.variables?.accountId === accountId;
  const mutation = {
    ...write,
    isPending: ownsWrite && write.isPending,
    isSuccess: ownsWrite && write.isSuccess,
    error: ownsWrite ? write.error : null,
  };
  const grant = (input: GrantScanQuotasRequest) => mutation.mutateAsync({ input, accountId, csrfToken });
  return { config, mutation, grant };
}
