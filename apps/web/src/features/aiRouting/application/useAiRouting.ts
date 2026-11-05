import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateAiRoutingRequest } from '@angia/contracts';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { refreshAiRoutingSession } from './refreshAiRoutingSession';
import type { AiRoutingRepository } from './ports';

export function useAiRouting(
  repository: AiRoutingRepository,
  csrfToken: string | null,
  accountId: string | null,
) {
  const client = useQueryClient();
  const queryKey = ['admin', 'ai-routing', accountId];
  const config = useQuery({
    queryKey,
    enabled: Boolean(csrfToken && accountId),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async ({ signal }) => {
      if (!csrfToken || !accountId) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      try {
        return await repository.get(signal);
      } catch (error) {
        await refreshAiRoutingSession(error, client);
        throw error;
      }
    },
  });
  const save = useMutation({
    retry: false,
    onMutate: () => ({ queryKey }),
    mutationFn: (input: UpdateAiRoutingRequest) => {
      if (!csrfToken || !accountId) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      return repository.save(input, csrfToken);
    },
    onSuccess: async (saved, _input, scope) => {
      if (!scope) return;
      await client.cancelQueries({ queryKey: scope.queryKey, exact: true });
      client.setQueryData(scope.queryKey, saved);
    },
    onError: (error) => refreshAiRoutingSession(error, client),
  });
  return { config, save };
}
