import { HouseholdMemberRoleBadge } from './HouseholdMemberRoleBadge';
import { MemberAvatar } from './MemberAvatar';
import { MemberDangerZone } from './MemberDangerZone';
import { MemberRoleEditor } from './MemberRoleEditor';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import type { useMemberPanelActions } from './useMemberPanelActions';
import type { MemberEditorProps } from './memberEditorProps';

type Props = MemberEditorProps & { actions: ReturnType<typeof useMemberPanelActions> };

export function MemberEditorContent({ member, titleId, actions }: Props) {
  return (
    <section className="household-member-panel" aria-labelledby={titleId ?? 'member-panel-name'}>
      <div className="household-member-panel-top">
        <span className="household-member-panel-eyebrow">Chi tiết phân quyền</span>
        <HouseholdMemberRoleBadge member={member} />
      </div>
      <div className="household-member-panel-hero">
        <MemberAvatar member={member} />
        <h3 id={titleId ?? 'member-panel-name'}>{member.displayName}</h3>
      </div>
      <MemberRoleEditor
        currentRole={member.role}
        selectedRole={actions.selectedRole}
        pending={actions.pending}
        error={actions.roleChange.error}
        onSelect={(role) => {
          actions.setSelectedRole(role);
          actions.roleChange.clearError();
        }}
        onSave={() => void actions.handleSaveRole()}
      />
      <MemberDangerZone
        disabled={actions.pending}
        onOpen={() => {
          actions.removal.clearError();
          actions.setConfirmOpen(true);
        }}
      />
      {actions.confirmOpen && (
        <RemoveMemberDialog
          displayName={member.displayName}
          pending={actions.removal.pending}
          error={actions.removal.error}
          onClose={() => actions.setConfirmOpen(false)}
          onConfirm={() => void actions.handleConfirmRemove()}
        />
      )}
    </section>
  );
}
