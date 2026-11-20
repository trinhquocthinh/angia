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
}: MemberEditorProps) {
  const { showToast } = useMemberToast();
  const [selectedRole, setSelectedRole] = useState<HouseholdMemberRole>(member.role);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const roleChange = useMemberRoleChange(householdMembersRepository.changeRole, csrfToken);
  const removal = useMemberRemoval(householdMembersRepository.remove, csrfToken);

  async function handleSuccess(message: string) {
    setRefreshing(true);
    try {
      await onReload();
      showToast(message);
      onClose();
    } finally {
      setRefreshing(false);
    }
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
    pending: refreshing || roleChange.pending || removal.pending,
    setSelectedRole,
    confirmOpen,
    setConfirmOpen,
    roleChange,
    removal,
    handleSaveRole,
    handleConfirmRemove,
  };
}
