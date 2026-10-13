import type { AdherencePeriod, AdherenceStatus } from './ports';

export interface PeriodBand {
  status: AdherenceStatus;
  from: string;
  to: string;
}

// Dải nền markArea: cắt theo khoảng đang xem; giai đoạn đang mở kéo tới hết khoảng.
export function periodBands(periods: AdherencePeriod[], range: { from: string; to: string }): PeriodBand[] {
  return periods.flatMap((period) => {
    const from = period.fromDate > range.from ? period.fromDate : range.from;
    const end = period.toDate ?? range.to;
    const to = end < range.to ? end : range.to;
    return from <= to ? [{ status: period.status, from, to }] : [];
  });
}
