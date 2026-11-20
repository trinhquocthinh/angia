import type { OwnershipTransferPorts } from './householdHomePorts';
import { useHouseholdHomeAction } from './useHouseholdHomeAction';

export function useOwnershipTransferActions(ports: OwnershipTransferPorts, csrfToken: string) {
  const { run, ...state } = useHouseholdHomeAction('ownership', csrfToken);
  return {
    ...state,
    sendOffer: (targetAccountId: string) => run(() => ports.sendOffer(targetAccountId, csrfToken)),
    revokeOffer: (offerId: string) => run(() => ports.revokeOffer(offerId, csrfToken)),
    decideOffer: (offerId: string, accept: boolean) =>
      run(() => ports.decideOffer(offerId, accept, csrfToken)),
  };
}
