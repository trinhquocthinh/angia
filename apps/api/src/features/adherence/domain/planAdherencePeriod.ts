import type { AdherencePeriod, AdherenceStatus } from './AdherencePeriod.js';

export type AdherencePlan = { ok: true; closeToDate: string | null } | { ok: false; code: 'ERR_VALIDATION' };

const isCalendarDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

const dayBefore = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};

// SPEC-022/BR-032: `latest` là giai đoạn có fromDate lớn nhất của cùng thuốc trên hồ sơ.
// Mốc mới phải sau hẳn mốc đó, không ở tương lai (ngày Việt Nam), và phải đổi trạng thái (owner chốt 2026-10-13).
export function planAdherencePeriod(
  latest: AdherencePeriod | null,
  status: AdherenceStatus,
  fromDate: string,
  today: string,
): AdherencePlan {
  if (!isCalendarDate(fromDate) || fromDate > today) return { ok: false, code: 'ERR_VALIDATION' };
  if (!latest) return { ok: true, closeToDate: null };
  if (fromDate <= latest.fromDate || status === latest.status) return { ok: false, code: 'ERR_VALIDATION' };
  if (latest.toDate === null) return { ok: true, closeToDate: dayBefore(fromDate) };
  return fromDate > latest.toDate ? { ok: true, closeToDate: null } : { ok: false, code: 'ERR_VALIDATION' };
}
