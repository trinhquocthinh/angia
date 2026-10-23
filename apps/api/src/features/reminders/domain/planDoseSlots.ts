import { DAILY_SLOTS, type DoseSlotTime, type DoseSlotTimes } from './DoseSlotConfig.js';

export type DoseSlotPlan = { ok: true; value: DoseSlotTime[] } | { ok: false; code: 'ERR_VALIDATION' };

// SPEC-025: các buổi đã cấu hình phải tăng dần nghiêm ngặt Sáng < Trưa < Chiều < Tối; buổi bỏ trống
// không tham gia so sánh. "HH:mm" cùng độ dài nên so chuỗi đúng thứ tự thời gian.
export function planDoseSlots(times: DoseSlotTimes): DoseSlotPlan {
  const slots = DAILY_SLOTS.flatMap((slot) => {
    const time = times[slot];
    return time === undefined ? [] : [{ slot, time }];
  });
  const ordered = slots.every((current, index) => index === 0 || slots[index - 1]!.time < current.time);
  return ordered ? { ok: true, value: slots } : { ok: false, code: 'ERR_VALIDATION' };
}
