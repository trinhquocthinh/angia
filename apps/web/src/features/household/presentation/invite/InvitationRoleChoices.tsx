import { ClayIcon } from '@src/shared/ui/ClayIcon';
import type { InvitationRole } from '../../application/invitationPorts';
import { InvitationIcon } from './InvitationIcon';

export function InvitationRoleChoices({
  value,
  disabled,
  onChange,
}: {
  value: InvitationRole | null;
  disabled: boolean;
  onChange: (role: InvitationRole) => void;
}) {
  return (
    <fieldset className="household-invite-roles" data-selected={value ?? 'none'} disabled={disabled}>
      <legend className="sr-only">Vai trò của người được mời</legend>
      {(['member', 'main'] as const).map((role) => (
        <label key={role} className="household-invite-role">
          <input
            type="radio"
            name="invitation-role"
            checked={value === role}
            onChange={() => onChange(role)}
          />
          <span className="household-invite-role-check">
            <InvitationIcon name="check" />
          </span>
          <span className="household-invite-role-icon">
            <ClayIcon name={role === 'main' ? 'manager' : 'member'} size={32} />
          </span>
          <strong>{role === 'main' ? 'Đồng quản lý' : 'Thành viên'}</strong>
          <span>{role === 'main' ? 'Quản lý hồ sơ và thành viên' : 'Xem hồ sơ liên kết với mình'}</span>
        </label>
      ))}
    </fieldset>
  );
}
