import { useId } from 'react';
import type { GuardianCandidate } from '../../application/guardianPorts';
import { guardianInitials, guardianRoleLabel } from '../../application/guardianRules';

type Props = {
  candidate: GuardianCandidate;
  selected: boolean;
  disabled: boolean;
  onSelect: (accountId: string) => void;
};

export function GuardianCandidateOption({ candidate, selected, disabled, onSelect }: Props) {
  const inputId = useId();
  return (
    <label
      htmlFor={inputId}
      className={`profile-guardian-candidate${selected ? ' profile-guardian-candidate-selected' : ''}`}
    >
      <div className="profile-guardian-candidate-main">
        <span className="profile-guardian-avatar" aria-hidden="true">
          {guardianInitials(candidate.displayName)}
        </span>
        <span className="profile-guardian-candidate-label">
          {candidate.displayName} · {guardianRoleLabel(candidate)}
        </span>
      </div>
      <input
        id={inputId}
        type="radio"
        name="guardian-candidate"
        className="profile-guardian-radio"
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect(candidate.accountId)}
      />
    </label>
  );
}
