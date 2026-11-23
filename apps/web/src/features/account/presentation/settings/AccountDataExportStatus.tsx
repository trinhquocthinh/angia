import type { DataExportPhase } from '@src/features/account/application/useDataExport';
import { AccountDataAlert } from '@src/features/account/presentation/settings/AccountDataAlert';
import { AccountSettingsIcon } from '@src/features/account/presentation/settings/AccountSettingsIcon';

export function AccountDataExportStatus({ phase }: { phase: DataExportPhase }) {
  if (phase === 'pending') {
    return (
      <p role="status" aria-live="polite" className="account-export-pending-note">
        Việc này có thể mất ít phút. Bạn có thể ở lại trang này.
      </p>
    );
  }
  if (phase === 'ready') {
    return (
      <div role="status" aria-live="polite" className="account-export-ready-box">
        <p className="account-export-ready-title">
          <AccountSettingsIcon name="check_circle" className="account-icon-md" />
          <span>Tệp ZIP đã sẵn sàng.</span>
        </p>
        <p className="account-export-ready-sub">Liên kết hết hạn sau 24 giờ.</p>
      </div>
    );
  }
  if (phase === 'rate_limited' || phase === 'failed') {
    return (
      <AccountDataAlert
        warning={phase === 'rate_limited'}
        message={
          phase === 'rate_limited'
            ? 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'
            : 'Chưa tạo được tệp dữ liệu. Vui lòng thử lại.'
        }
      />
    );
  }
  return null;
}
