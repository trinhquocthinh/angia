import { useId } from 'react';
import type { HouseholdMember } from '../../application/memberPorts';
import { MemberAvatar } from '../members/MemberAvatar';

type Props = {
  member: HouseholdMember;
  selected: boolean;
  disabled: boolean;
  onSelect: (accountId: string) => void;
};

export function OwnershipCandidateOption({ member, selected, disabled, onSelect }: Props) {
  const inputId = useId();
  return (
    <label
      htmlFor={inputId}
      className={`household-ownership-option${selected ? ' household-ownership-option-selected' : ''}`}
    >
      <div className="household-ownership-option-main">
        <MemberAvatar member={member} />
        <div className="household-ownership-option-text">
          <span className="household-ownership-option-name">{member.displayName}</span>
          <span className="household-ownership-option-role">
            <span className="household-ownership-option-dot" aria-hidden="true" />
            Đồng quản lý
          </span>
        </div>
      </div>
      <span className="household-ownership-radio-visual" aria-hidden="true">
        {selected && <span className="household-ownership-radio-core" />}
      </span>
      <input
        id={inputId}
        type="radio"
        name="ownership-target"
        className="sr-only"
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect(member.accountId)}
      />
    </label>
  );
}
