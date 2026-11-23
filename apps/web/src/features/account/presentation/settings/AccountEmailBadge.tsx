import type { AccountEmailStatus } from '@src/features/account/application/ports';
import { AccountSettingsIcon } from '@src/features/account/presentation/settings/AccountSettingsIcon';

export function AccountEmailBadge({ emailStatus }: { emailStatus: AccountEmailStatus }) {
  if (!emailStatus.email) return null;
  if (emailStatus.emailVerified) {
    return (
      <span className="account-status-chip account-status-verified">
        <AccountSettingsIcon name="check_circle" className="account-icon-sm" />
        <span>Đã xác minh</span>
      </span>
    );
  }
  return (
    <span className="account-status-chip account-status-unverified">
      <AccountSettingsIcon name="warning" className="account-icon-sm" />
      <span>Chưa xác minh</span>
    </span>
  );
}
