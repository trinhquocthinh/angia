import type { AiBillingView } from '@angia/contracts';
import { formatBillingUsd } from './formatBillingUsd';

const labels = {
  ready: 'Đã đối chiếu',
  incomplete: 'Chưa đủ dữ liệu',
  stale: 'Dữ liệu đã cũ',
  unconfigured: 'Chưa cấu hình nguồn phí',
};
export function describeAiBilling(view: AiBillingView, now: Date) {
  const tooOld = view.lastSyncedAt !== null && now.getTime() - Date.parse(view.lastSyncedAt) > 180_000;
  const status = view.status === 'ready' && tooOld ? 'stale' : view.status;
  return {
    confirmedAmount: formatBillingUsd(view.confirmedSpendUsd),
    actualAmount:
      status === 'ready' && view.actualSpendUsd !== null ? formatBillingUsd(view.actualSpendUsd) : null,
    label: labels[status],
    stale: status === 'stale',
  };
}
