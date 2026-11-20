import type { LeaveHouseholdAction, OwnProfileDisposition } from './householdHomePorts';
import { useHouseholdHomeAction } from './useHouseholdHomeAction';

export function useLeaveHousehold(action: LeaveHouseholdAction, csrfToken: string) {
  const { run, ...state } = useHouseholdHomeAction('leave', csrfToken);
  return {
    ...state,
    leave: (disposition: OwnProfileDisposition) => run(() => action(disposition, csrfToken)),
  };
}
