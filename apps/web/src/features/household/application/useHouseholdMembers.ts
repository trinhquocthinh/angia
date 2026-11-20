import { useQuery, useQueryClient } from '@tanstack/react-query';
import { memberActionError } from './memberActionError';
import { householdMembersQueryKey, type HouseholdMembersRepository } from './memberPorts';

export function useHouseholdMembers(repository: HouseholdMembersRepository, scope: string, enabled = true) {
  const client = useQueryClient();
  const key = householdMembersQueryKey(scope);
  const query = useQuery({
    queryKey: key,
    enabled,
    gcTime: 0,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      const result = await repository.list();
      if (!result.ok) throw new Error(memberActionError(result.code));
      return result.value;
    },
  });

  function reload() {
    return client.invalidateQueries({ queryKey: key });
  }

  return { query, reload };
}
