import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';
import type { ReuseSelection } from './ReuseSelection.js';

// Mua lại theo đơn cũ được ghi trước tối đa 30 ngày (owner chốt 2026-10-13).
const MAX_DAYS_AHEAD = 30;
type ReuseValidation =
  | { ok: true }
  | { ok: false; code: 'ERR_VALIDATION' }
  | { ok: false; code: 'ERR_DOSE_INFO_MISSING'; invalidItemIndexes: number[] };

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

// SPEC-029: dòng thuộc đơn, không trùng → issuedDate < startDate ≤ hôm nay + 30 → số ngày hoặc Dài hạn (BR-025).
// Ngày dạng YYYY-MM-DD đã kiểm ở hợp đồng nên so sánh chuỗi đúng thứ tự lịch.
export function validateReuseRequest(
  prescription: Prescription,
  startDate: string,
  selections: readonly ReuseSelection[],
  today: string,
): ReuseValidation {
  const ids = selections.map((selection) => selection.prescriptionItemId);
  const known = new Set(prescription.items.map((item) => item.id));
  if (ids.length === 0 || new Set(ids).size !== ids.length || ids.some((id) => !known.has(id)))
    return { ok: false, code: 'ERR_VALIDATION' };
  if (startDate <= prescription.issuedDate || startDate > addDays(today, MAX_DAYS_AHEAD))
    return { ok: false, code: 'ERR_VALIDATION' };
  const invalidItemIndexes = selections.flatMap((selection, index) =>
    !selection.longTerm && selection.durationDays === null ? [index] : [],
  );
  return invalidItemIndexes.length > 0
    ? { ok: false, code: 'ERR_DOSE_INFO_MISSING', invalidItemIndexes }
    : { ok: true };
}
