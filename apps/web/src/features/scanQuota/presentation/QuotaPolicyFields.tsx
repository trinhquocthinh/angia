import type { PolicyDraft, PolicyErrors } from '../application/ports';
import { QuotaTextField } from './QuotaTextField';
export function QuotaPolicyFields({
  draft,
  errors,
  onChange,
}: {
  draft: PolicyDraft;
  errors: PolicyErrors;
  onChange(field: keyof PolicyDraft, value: string): void;
}) {
  return (
    <>
      <QuotaTextField
        id="scan-estimate"
        label="Ước tính chi phí cho mỗi lượt (USD)"
        value={draft.estimatedCostPerScanUsd}
        onChange={(value) => onChange('estimatedCostPerScanUsd', value)}
        {...(errors.estimatedCostPerScanUsd ? { error: errors.estimatedCostPerScanUsd } : {})}
      />
      <QuotaTextField
        id="scan-reserve"
        label="Dự phòng ngân sách (%)"
        value={draft.reservePercent}
        onChange={(value) => onChange('reservePercent', value)}
        {...(errors.reservePercent ? { error: errors.reservePercent } : {})}
      />
      <QuotaTextField
        id="scan-trial"
        label="Lượt dùng thử cho gia đình mới"
        mode="numeric"
        value={draft.trialScans}
        onChange={(value) => onChange('trialScans', value)}
        {...(errors.trialScans ? { error: errors.trialScans } : {})}
      />
    </>
  );
}
