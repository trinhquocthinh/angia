import { useId } from 'react';
import type { ExportProfileOption } from '@src/features/account/application/exportProfileOptions';
import type { DataExportPhase } from '@src/features/account/application/useDataExport';
import { AccountDataExportAction } from '@src/features/account/presentation/settings/AccountDataExportAction';
import { AccountDataExportStatus } from '@src/features/account/presentation/settings/AccountDataExportStatus';
import { AccountSettings3DIcon } from '@src/features/account/presentation/settings/AccountSettings3DIcon';

type Props = {
  phase: DataExportPhase;
  options: readonly ExportProfileOption[];
  selectedScope: string;
  actionLabel: string;
  downloadUrl: string | null;
  onSelectScope: (value: string) => void;
  onStartExport: () => void;
};

const cardPhaseClass: Record<DataExportPhase, string> = {
  idle: 'account-card',
  pending: 'account-card',
  ready: 'account-card account-export-card-ready',
  rate_limited: 'account-card account-export-card-rate-limited',
  failed: 'account-card account-export-card-failed',
};

export function AccountDataExportCard({
  phase,
  options,
  selectedScope,
  actionLabel,
  downloadUrl,
  onSelectScope,
  onStartExport,
}: Props) {
  const selectId = useId();
  return (
    <section className={cardPhaseClass[phase]} aria-labelledby="account-data-heading">
      <div className="account-card-title-group">
        <AccountSettings3DIcon name="download-3d" />
        <h2 id="account-data-heading" className="account-card-title">
          Dữ liệu của tôi
        </h2>
      </div>
      <p className="account-card-copy">
        Tải về dữ liệu tài khoản và dữ liệu sức khoẻ của hồ sơ liên kết với bạn.
      </p>
      {options.length > 0 && (
        <div className="account-export-selector">
          <label htmlFor={selectId} className="account-export-label">
            Hồ sơ cần tải
          </label>
          <select
            id={selectId}
            className="account-export-select"
            value={selectedScope}
            disabled={phase === 'pending'}
            onChange={(event) => onSelectScope(event.target.value)}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <AccountDataExportStatus phase={phase} />
      <AccountDataExportAction
        phase={phase}
        actionLabel={actionLabel}
        downloadUrl={downloadUrl}
        onStartExport={onStartExport}
      />
    </section>
  );
}
