import type { DataExportPhase } from '@src/features/account/application/useDataExport';
import { AccountSettingsIcon } from '@src/features/account/presentation/settings/AccountSettingsIcon';

type Props = {
  phase: DataExportPhase;
  actionLabel: string;
  downloadUrl: string | null;
  onStartExport: () => void;
};

export function AccountDataExportAction({ phase, actionLabel, downloadUrl, onStartExport }: Props) {
  if (phase === 'pending') {
    return (
      <button type="button" disabled className="account-export-btn account-export-btn-pending">
        <AccountSettingsIcon name="spinner" className="account-icon-md account-spinner" />
        <span>Đang tạo tệp…</span>
      </button>
    );
  }
  if (phase === 'ready' && downloadUrl) {
    return (
      <a href={downloadUrl} download className="account-primary-btn account-export-btn account-export-link">
        <AccountSettingsIcon name="download" className="account-icon-md" />
        <span>Tải tệp ZIP</span>
      </a>
    );
  }
  if (phase === 'failed') {
    return (
      <button type="button" className="account-primary-btn account-export-btn" onClick={onStartExport}>
        <AccountSettingsIcon name="refresh" className="account-icon-md" />
        <span>Thử lại</span>
      </button>
    );
  }
  return (
    <button type="button" className="account-primary-btn account-export-btn" onClick={onStartExport}>
      <span>{actionLabel}</span>
    </button>
  );
}
