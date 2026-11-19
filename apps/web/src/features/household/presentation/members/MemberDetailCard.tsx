import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { memberActionError } from '../../application/memberActionError';
import { useMemberRemoval } from '../../application/useMemberRemoval';
import { useMemberRoleChange } from '../../application/useMemberRoleChange';
import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';
import { householdMembersRepository } from '../../infrastructure/householdMembersRepository';
import { MemberDangerZone } from './MemberDangerZone';
import { MemberProtectedNotice } from './MemberProtectedNotice';
import { MemberProfileHead } from './MemberProfileHead';
import { MemberRoleEditor } from './MemberRoleEditor';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import { useMemberToast } from './memberToastContext';

type Props = { member: HouseholdMember; csrfToken: string; onReload: () => Promise<void> };

export function MemberDetailCard({ member, csrfToken, onReload }: Props) {
  const navigate = useNavigate();
  const { showToast } = useMemberToast();
  const [selectedRole, setSelectedRole] = useState<HouseholdMemberRole>(member.role);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const roleChange = useMemberRoleChange(householdMembersRepository.changeRole, csrfToken);
  const removal = useMemberRemoval(householdMembersRepository.remove, csrfToken);

  async function finishSuccess(message: string) {
    await onReload();
    showToast(message);
    void navigate({ to: '/family/members' });
  }
  async function handleSaveRole() {
    const outcome = await roleChange.changeRole(member.accountId, selectedRole, member.displayName);
    if (outcome.status === 'ok') await finishSuccess('Đã đổi vai trò');
    else if (outcome.status === 'not_found') await onReload();
  }
  async function handleConfirmRemove() {
    const outcome = await removal.remove(member.accountId, member.displayName);
    if (outcome.status === 'ok' || outcome.status === 'not_found') setConfirmOpen(false);
    if (outcome.status === 'ok') await finishSuccess(`Đã gỡ ${member.displayName} khỏi nhà`);
    else if (outcome.status === 'not_found') await onReload();
  }

  const ownerProtectedMessage = memberActionError('ERR_OWNER_PROTECTED');
  if (roleChange.error === ownerProtectedMessage || removal.error === ownerProtectedMessage) {
    return <MemberProtectedNotice message={ownerProtectedMessage} />;
  }

  return (
    <section className="household-member-detail-card" aria-labelledby="member-detail-name">
      <MemberProfileHead member={member} />
      <MemberRoleEditor
        currentRole={member.role}
        selectedRole={selectedRole}
        pending={roleChange.pending}
        error={roleChange.error}
        onSelect={(role) => {
          setSelectedRole(role);
          roleChange.clearError();
        }}
        onSave={() => void handleSaveRole()}
      />
      <MemberDangerZone
        disabled={roleChange.pending || removal.pending}
        onOpen={() => {
          removal.clearError();
          setConfirmOpen(true);
        }}
      />
      {confirmOpen && (
        <RemoveMemberDialog
          displayName={member.displayName}
          pending={removal.pending}
          error={removal.error}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => void handleConfirmRemove()}
        />
      )}
    </section>
  );
}
