import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import type { AdherencePeriod, AdherenceStatus } from './ports';

export const STATUS_LABEL: Record<AdherenceStatus, string> = { taking: 'Đang dùng', stopped: 'Ngưng' };

// Chỉ trạng thái và mốc ngày — không nhận xét (BR-033).
export function periodText(period: AdherencePeriod): string {
  const label = STATUS_LABEL[period.status];
  return period.toDate
    ? `${label} ${formatDay(period.fromDate)} – ${formatDay(period.toDate)}`
    : `${label} từ ${formatDay(period.fromDate)} đến nay`;
}
