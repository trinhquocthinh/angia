import type { DoseSlot } from './Prescription.js';

export interface DoseInfo {
  quantityPerDose: number | null;
  slots: readonly DoseSlot[];
  durationDays: number | null;
  longTerm: boolean;
  externalUse: boolean;
}

// BR-025 / SPEC-014: dòng thiếu liều mỗi lần, buổi dùng, hoặc số ngày khi không dài hạn → trả chỉ số dòng (từ 0).
// Thuốc dùng ngoài hoặc dòng "Khi cần" được trống liều; nếu có nhập vẫn phải > 0.
export function findIncompleteDoseItems(items: readonly DoseInfo[]): number[] {
  return items.flatMap((item, index) => {
    const hasDose =
      item.quantityPerDose === null
        ? item.externalUse || item.slots.includes('as_needed')
        : item.quantityPerDose > 0;
    const hasDuration = item.longTerm || item.durationDays !== null;
    return hasDose && item.slots.length > 0 && hasDuration ? [] : [index];
  });
}
