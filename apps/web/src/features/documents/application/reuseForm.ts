import type { Prescription, ReusePrescriptionRequest } from '@angia/contracts';

export interface ReuseItemForm {
  prescriptionItemId: string;
  selected: boolean;
  durationDays: string;
  longTerm: boolean;
}
export interface ReuseForm {
  startDate: string;
  items: ReuseItemForm[];
}

const MAX_DAYS_AHEAD = 30;
const DATE_ERROR = 'Ngày bắt đầu phải sau ngày kê đơn và không quá 30 ngày tới.';

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
const validDuration = (value: string) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 3650;

// SPEC-029: mặc định hôm nay, chọn mọi dòng, số ngày/Dài hạn như đơn gốc (owner chốt 2026-10-13).
export function initialReuseForm(prescription: Prescription, today: string): ReuseForm {
  return {
    startDate: today,
    items: prescription.items.map((item) => ({
      prescriptionItemId: item.id,
      selected: true,
      durationDays: item.longTerm || item.durationDays === null ? '' : String(item.durationDays),
      longTerm: item.longTerm,
    })),
  };
}

export const reuseDateBounds = (issuedDate: string, today: string) => ({
  min: addDays(issuedDate, 1),
  max: addDays(today, MAX_DAYS_AHEAD),
});

export function validateReuseForm(form: ReuseForm, issuedDate: string, today: string): string | null {
  if (!form.items.some((item) => item.selected)) return 'Chọn ít nhất một dòng thuốc.';
  const { min, max } = reuseDateBounds(issuedDate, today);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate) || form.startDate < min || form.startDate > max)
    return DATE_ERROR;
  const index = form.items.findIndex(
    (item) => item.selected && !item.longTerm && !validDuration(item.durationDays),
  );
  return index === -1 ? null : `Dòng ${index + 1}: nhập số ngày (1–3650) hoặc bật Dài hạn.`;
}

export function toReuseRequest(form: ReuseForm): ReusePrescriptionRequest {
  return {
    startDate: form.startDate,
    items: form.items
      .filter((item) => item.selected)
      .map((item) => ({
        prescriptionItemId: item.prescriptionItemId,
        durationDays: item.longTerm ? null : Number(item.durationDays),
        longTerm: item.longTerm,
      })),
  };
}
