import type { HouseholdGovernanceProps } from './householdGovernanceProps';
import { LeaveHouseholdSection } from '../leave/LeaveHouseholdSection';

export function HouseholdGovernanceLeave(props: HouseholdGovernanceProps) {
  return (
    <LeaveHouseholdSection
      familyName={props.familyName}
      isOwner={props.self.isOwner}
      otherCount={props.members.filter((member) => !member.isSelf).length}
      pending={props.leavePending}
      error={props.leaveError}
      errorCode={props.leaveErrorCode}
      onLeave={props.onLeave}
      onClearError={props.onClearLeaveError}
      onScrollToDelete={props.onScrollToDelete}
    />
  );
}
