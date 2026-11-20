import { deletionRequestQueryKey, type HouseholdHomeRepository } from './householdHomePorts';
import { useHouseholdHomeQuery } from './useHouseholdHomeQuery';

export function useDeletionRequest(
  repository: Pick<HouseholdHomeRepository, 'getCurrentDeletionRequest'>,
  scope: string,
  enabled = false,
) {
  return useHouseholdHomeQuery(
    deletionRequestQueryKey(scope),
    () => repository.getCurrentDeletionRequest(),
    'deletion',
    enabled,
  );
}
