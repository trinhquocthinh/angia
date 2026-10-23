import type { DoseSlotList } from '@angia/contracts';
import type { DoseSlotTimes } from './ports';

export const DOSE_SLOTS = [
  { slot: 'morning', label: 'Sáng' },
  { slot: 'noon', label: 'Trưa' },
  { slot: 'afternoon', label: 'Chiều' },
  { slot: 'evening', label: 'Tối' },
] as const;
export type DailySlot = (typeof DOSE_SLOTS)[number]['slot'];
export type DoseSlotForm = Record<DailySlot, string>;
const emptyDoseSlotForm: DoseSlotForm = { morning: '', noon: '', afternoon: '', evening: '' };

type Validation = { ok: true; slots: DoseSlotTimes } | { ok: false; slot: DailySlot; message: string };

export const toDoseSlotForm = (saved: DoseSlotList): DoseSlotForm =>
  saved.reduce((form, item) => ({ ...form, [item.slot]: item.time }), emptyDoseSlotForm);

// Báo sớm lỗi thứ tự Sáng < Trưa < Chiều < Tối (BR-036) trên buổi đi sau; API vẫn kiểm lại.
export function validateDoseSlotForm(form: DoseSlotForm): Validation {
  const slots: DoseSlotTimes = {};
  let previous: { label: string; time: string } | null = null;
  for (const { slot, label } of DOSE_SLOTS) {
    const time = form[slot].slice(0, 5);
    if (!time) continue;
    if (previous && time <= previous.time) {
      return {
        ok: false,
        slot,
        message: `Giờ buổi ${label} phải sau buổi ${previous.label} (${previous.time}).`,
      };
    }
    slots[slot] = time;
    previous = { label, time };
  }
  return { ok: true, slots };
}
