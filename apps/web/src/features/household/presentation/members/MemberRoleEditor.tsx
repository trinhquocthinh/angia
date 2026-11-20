import { Button } from '@src/shared/ui/button/Button';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { MemberClayGlyph } from './MemberClayGlyph';
import { memberRoleDescription } from '../../application/memberDisplay';
import type { HouseholdMemberRole } from '../../application/memberPorts';

type Props = {
  currentRole: HouseholdMemberRole;
  selectedRole: HouseholdMemberRole;
  pending: boolean;
  error: string | null;
  onSelect: (role: HouseholdMemberRole) => void;
  onSave: () => void;
};

export function MemberRoleEditor({ currentRole, selectedRole, pending, error, onSelect, onSave }: Props) {
  const unchanged = selectedRole === currentRole;
  return (
    <section className="household-member-role-section" aria-labelledby="member-role-heading">
      <div className="household-member-section-head">
        <h3 id="member-role-heading">Vai trò trong nhà</h3>
        <p>Chọn quyền hạn cho thành viên này trong nhà.</p>
      </div>
      <fieldset className="household-member-role-choices" disabled={pending}>
        <legend className="sr-only">Chọn vai trò trong nhà</legend>
        {(['main', 'member'] as const).map((role) => (
          <label key={role} className="household-member-role-option" data-role={role}>
            <input
              type="radio"
              name="member-role"
              value={role}
              checked={selectedRole === role}
              onChange={() => onSelect(role)}
            />
            <span className="household-member-role-option-icon" aria-hidden="true">
              <MemberClayGlyph name={`role-option-${role}`} size={32} />
            </span>
            <span className="household-member-role-option-text">
              <strong>{role === 'main' ? 'Đồng quản lý' : 'Thành viên'}</strong>
              <span>{memberRoleDescription(role)}</span>
            </span>
            <span className="household-member-role-radio" aria-hidden="true" />
          </label>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="household-member-alert">
          {error}
        </p>
      )}
      <Button className="household-member-save-btn" disabled={unchanged || pending} onClick={onSave}>
        <AdminIcon name="save" size={20} />
        {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </Button>
    </section>
  );
}
