import type { DailyDoseSlot, DoseSlot } from './reviewPorts';

// Thứ tự buổi trong ngày theo SDD §2.1a; nhãn hiển thị cho chip chọn buổi. Thuốc bổ chỉ dùng 4 buổi này.
export const DOSE_SLOTS: readonly { value: DailyDoseSlot; label: string }[] = [
  { value: 'morning', label: 'Sáng' },
  { value: 'noon', label: 'Trưa' },
  { value: 'afternoon', label: 'Chiều' },
  { value: 'evening', label: 'Tối' },
];
// "Khi cần" (BR-025 2026-10-12): chỉ dòng thuốc từ đơn, đứng một mình, sau Tối.
export const AS_NEEDED = { value: 'as_needed', label: 'Khi cần' } as const;
const ORDER: readonly DoseSlot[] = [...DOSE_SLOTS.map((slot) => slot.value), AS_NEEDED.value];

export const doseSlotLabel = (slot: DoseSlot): string =>
  slot === AS_NEEDED.value ? AS_NEEDED.label : DOSE_SLOTS.find((item) => item.value === slot)!.label;

export const sortDoseSlots = <T extends DoseSlot>(slots: readonly T[]): T[] =>
  ORDER.filter((value): value is T => slots.includes(value as T));

// Bật/tắt một buổi; "Khi cần" và các buổi trong ngày loại trừ nhau.
export function toggleDoseSlot(slots: readonly DoseSlot[], slot: DoseSlot): DoseSlot[] {
  if (slots.includes(slot)) return slots.filter((value) => value !== slot);
  if (slot === AS_NEEDED.value) return [AS_NEEDED.value];
  return sortDoseSlots([...slots.filter((value) => value !== AS_NEEDED.value), slot]);
}
