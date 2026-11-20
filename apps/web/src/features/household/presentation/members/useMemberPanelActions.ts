import { useState } from 'react';
import { memberActionError } from '../../application/memberActionError';
import { useMemberRemoval } from '../../application/useMemberRemoval';
import { useMemberRoleChange } from '../../application/useMemberRoleChange';
import type { HouseholdMemberRole } from '../../application/memberPorts';
import { householdMembersRepository } from '../../infrastructure/householdMembersRepository';
import { useMemberToast } from './memberToastContext';
import type { MemberEditorProps } from './memberEditorProps';

export function useMemberPanelActions({
  member,
  csrfToken,
  onReload,
  onClose,
  onNotFound,
  isDesktop = true,
}: MemberEditorProps) {
  const { showToast } = useMemberToast();
  const [selectedRole, setSelectedRole] = useState<HouseholdMemberRole>(member.role);
  const [confirmation, setConfirmation] = useState({ open: false, isDesktop });
  const setConfirmOpen = (open: boolean) => setConfirmation({ open, isDesktop });
  const roleChange = useMemberRoleChange(householdMembersRepository.changeRole, csrfToken);
  const removal = useMemberRemoval(householdMembersRepository.remove, csrfToken);

  async function handleSuccess(message: string) {
    await onReload();
    showToast(message);
    onClose();
  }

  async function handleNotFound() {
    onNotFound?.(memberActionError('ERR_NOT_FOUND'));
    await onReload();
  }

  async function handleSaveRole() {
    const outcome = await roleChange.changeRole(member.accountId, selectedRole, member.displayName);
    if (outcome.status === 'ok') await handleSuccess('Đã đổi vai trò');
    else if (outcome.status === 'not_found') await handleNotFound();
  }

  async function handleConfirmRemove() {
    const outcome = await removal.remove(member.accountId, member.displayName);
    if (outcome.status === 'ok' || outcome.status === 'not_found') setConfirmOpen(false);
    if (outcome.status === 'ok') await handleSuccess(`Đã gỡ ${member.displayName} khỏi nhà`);
    else if (outcome.status === 'not_found') await handleNotFound();
  }

  return {
    selectedRole,
    setSelectedRole,
    confirmOpen: confirmation.open,
    confirmDesktop: confirmation.isDesktop,
    setConfirmOpen,
    roleChange,
    removal,
    handleSaveRole,
    handleConfirmRemove,
  };
}
