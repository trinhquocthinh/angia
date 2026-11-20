import { ownershipOfferQueryKey, type HouseholdHomeRepository } from './householdHomePorts';
import { useHouseholdHomeQuery } from './useHouseholdHomeQuery';

export function useOwnershipOffer(
  repository: Pick<HouseholdHomeRepository, 'getCurrentOffer'>,
  scope: string,
  enabled = true,
) {
  return useHouseholdHomeQuery(
    ownershipOfferQueryKey(scope),
    () => repository.getCurrentOffer(),
    'ownership',
    enabled,
  );
}
