import { useQuery, useQueryClient } from '@tanstack/react-query';
import { householdHomeError, type HouseholdHomeErrorContext } from './householdHomeError';
import type { HomeResult } from './householdHomePorts';

export function useHouseholdHomeQuery<T>(
  key: readonly string[],
  read: () => Promise<HomeResult<T>>,
  context: HouseholdHomeErrorContext,
  enabled: boolean,
) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: key,
    enabled,
    gcTime: 0,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      const result = await read();
      if (!result.ok) throw new Error(householdHomeError(result.error, context));
      return result.value;
    },
  });
  return { query, reload: () => client.invalidateQueries({ queryKey: key }) };
}
