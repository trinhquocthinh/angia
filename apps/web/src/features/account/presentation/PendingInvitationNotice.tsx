import { readPendingInvitation } from '@src/features/household/application/pendingHouseholdInvitation';

export function PendingInvitationNotice() {
  if (!readPendingInvitation()) return null;
  return (
    <p
      role="status"
      className="registration-closed-notice mb-6 rounded-xl border border-border bg-bg p-4 text-body text-text-primary"
    >
      Đăng nhập hoặc tạo tài khoản để nhận lời mời.
    </p>
  );
}
