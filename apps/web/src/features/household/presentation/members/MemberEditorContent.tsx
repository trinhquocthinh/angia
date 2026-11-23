import { canManageMember } from '../../application/memberDisplay';
import { HouseholdMemberRoleBadge } from './HouseholdMemberRoleBadge';
import { MemberAvatar } from './MemberAvatar';
import { MemberDangerZone } from './MemberDangerZone';
import { MemberResetPasswordAction } from './MemberResetPasswordAction';
import { MemberRoleEditor } from './MemberRoleEditor';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import { ResetMemberPasswordDialog } from './ResetMemberPasswordDialog';
import type { useMemberPanelActions } from './useMemberPanelActions';
import type { MemberEditorProps } from './memberEditorProps';

type Props = MemberEditorProps & { actions: ReturnType<typeof useMemberPanelActions> };

export function MemberEditorContent({ member, viewerRole = 'main', titleId, actions }: Props) {
  const canResetPassword = canManageMember(viewerRole, member);
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
      {canResetPassword && (
        <MemberResetPasswordAction disabled={actions.pending} onOpen={actions.openResetDialog} />
      )}
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
      {actions.resetDialogOpen && (
        <ResetMemberPasswordDialog
          displayName={member.displayName}
          pending={actions.passwordReset.pending}
          error={actions.passwordReset.error}
          result={actions.passwordReset.result}
          onClose={actions.closeResetDialog}
          onConfirm={() => void actions.handleConfirmResetPassword()}
        />
      )}
    </section>
  );
}
