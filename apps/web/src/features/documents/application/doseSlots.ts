import type { DoseSlot } from './reviewPorts';

// Thứ tự buổi trong ngày theo SDD §2.1a; nhãn hiển thị cho chip chọn buổi.
export const DOSE_SLOTS: readonly { value: DoseSlot; label: string }[] = [
  { value: 'morning', label: 'Sáng' },
  { value: 'noon', label: 'Trưa' },
  { value: 'afternoon', label: 'Chiều' },
  { value: 'evening', label: 'Tối' },
];

export const sortDoseSlots = (slots: readonly DoseSlot[]): DoseSlot[] =>
  DOSE_SLOTS.map((slot) => slot.value).filter((value) => slots.includes(value));
