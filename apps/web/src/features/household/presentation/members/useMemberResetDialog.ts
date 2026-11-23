import { useState } from 'react';
import { useMemberPasswordReset } from '../../application/useMemberPasswordReset';
import { householdMembersRepository } from '../../infrastructure/householdMembersRepository';
import type { MemberEditorProps } from './memberEditorProps';

export function useMemberResetDialog({
  member,
  csrfToken,
  onReload,
  onNotFound,
}: Pick<MemberEditorProps, 'member' | 'csrfToken' | 'onReload' | 'onNotFound'>) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const passwordReset = useMemberPasswordReset(householdMembersRepository.resetPassword, csrfToken);

  function openResetDialog() {
    passwordReset.clearResult();
    setResetDialogOpen(true);
  }

  function closeResetDialog() {
    passwordReset.clearResult();
    setResetDialogOpen(false);
  }

  async function handleConfirmResetPassword() {
    const outcome = await passwordReset.resetPassword(member.accountId, member.displayName);
    if (outcome.status === 'not_found') {
      closeResetDialog();
      onNotFound?.(outcome.message);
      await onReload();
    } else if (outcome.status === 'owner_protected') {
      setResetDialogOpen(false);
      onNotFound?.(outcome.message);
      await onReload();
    } else if (outcome.status === 'forbidden') {
      await onReload();
    }
  }

  return {
    resetDialogOpen,
    passwordReset,
    openResetDialog,
    closeResetDialog,
    handleConfirmResetPassword,
  };
}
