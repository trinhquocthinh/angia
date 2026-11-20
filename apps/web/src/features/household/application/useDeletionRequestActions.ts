import type { DeletionRequestPorts } from './householdHomePorts';
import { useHouseholdHomeAction } from './useHouseholdHomeAction';

export function useDeletionRequestActions(ports: DeletionRequestPorts, csrfToken: string) {
  const { run, ...state } = useHouseholdHomeAction('deletion', csrfToken);
  return {
    ...state,
    requestDeletion: (confirmFamilyName: string) =>
      run(() => ports.requestDeletion(confirmFamilyName, csrfToken)),
    revokeDeletion: (requestId: string) => run(() => ports.revokeDeletion(requestId, csrfToken)),
  };
}
