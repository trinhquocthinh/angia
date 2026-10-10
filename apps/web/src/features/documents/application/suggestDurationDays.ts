import type { PrescriptionItemValues } from './prescriptionForm';

export type DurationInputs = Pick<
  PrescriptionItemValues,
  'totalQuantity' | 'quantityPerDose' | 'slots' | 'durationDays' | 'longTerm'
>;
export type DurationSuggestion = { days: number; total: number; perDose: number; slotCount: number };

const DECIMAL = /^\d+([.,]\d+)?$/;
const positive = (text: string) => {
  const trimmed = text.trim();
  const value = Number(trimmed.replace(',', '.'));
  return DECIMAL.test(trimmed) && value > 0 ? value : null;
};

// BR-025 (owner chốt 2026-10-09): chỉ gợi ý, người duyệt bấm "Áp dụng" mới điền. Gợi ý khi đủ tổng số lượng,
// liều mỗi lần, ≥ 1 buổi, không dài hạn, chưa có số ngày và phép chia ra số nguyên dương.
export function suggestDurationDays(item: DurationInputs): DurationSuggestion | null {
  if (item.longTerm || item.durationDays.trim() !== '' || item.slots.length === 0) return null;
  const total = positive(item.totalQuantity);
  const perDose = positive(item.quantityPerDose);
  if (total === null || perDose === null) return null;
  const exact = total / (perDose * item.slots.length);
  const days = Math.round(exact);
  if (days < 1 || Math.abs(exact - days) > 1e-9) return null;
  return { days, total, perDose, slotCount: item.slots.length };
}
