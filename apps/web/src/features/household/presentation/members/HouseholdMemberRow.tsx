import { canManageMember } from '../../application/memberDisplay';
import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';
import { HouseholdMemberRowContent } from './HouseholdMemberRowContent';

type Props = {
  member: HouseholdMember;
  viewerRole: HouseholdMemberRole;
  selected: boolean;
  onSelect: (accountId: string, trigger: HTMLButtonElement) => void;
};

export function HouseholdMemberRow({ member, viewerRole, selected, onSelect }: Props) {
  const manageable = canManageMember(viewerRole, member);

  return (
    <li className="household-member-item">
      {manageable ? (
        <button
          type="button"
          className={
            selected
              ? 'household-member-row household-member-row-btn household-member-row-selected'
              : 'household-member-row household-member-row-btn'
          }
          aria-pressed={selected}
          onClick={(event) => {
            event.currentTarget.focus();
            onSelect(member.accountId, event.currentTarget);
          }}
        >
          <HouseholdMemberRowContent member={member} manageable={manageable} selected={selected} />
        </button>
      ) : (
        <div className="household-member-row">
          <HouseholdMemberRowContent member={member} manageable={manageable} selected={selected} />
        </div>
      )}
    </li>
  );
}
