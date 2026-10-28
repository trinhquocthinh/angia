import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { refreshQuotaSession } from './refreshQuotaSession';
import type { QuotaWrite, ScanQuotaRepository } from './ports';
type ScopedWrite = QuotaWrite & { accountId: string | null; csrfToken: string | null };
export function useScanQuotaMutation(repository: ScanQuotaRepository) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (write: ScopedWrite) => {
      if (!write.csrfToken || !write.accountId) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      return repository.grant(write.input, write.csrfToken);
    },
    onSuccess: async (saved, write) => {
      const queryKey = ['admin', 'scan-quotas', write.accountId];
      await client.cancelQueries({ queryKey, exact: true });
      client.setQueryData(queryKey, saved);
    },
    onError: (error) => refreshQuotaSession(error, client),
  });
}
