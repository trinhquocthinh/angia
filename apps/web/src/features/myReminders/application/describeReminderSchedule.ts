import type { MyReminder } from '@angia/contracts';
import { DOSE_SLOTS } from '@src/features/reminders/application/doseSlotForm';

const vietnamTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Buổi + ngày lịch (YYYY-MM-DD, không đổi múi giờ) + giờ nhắc theo giờ Việt Nam.
export function describeReminderSchedule(reminder: Pick<MyReminder, 'slot' | 'date' | 'scheduledAt'>) {
  return {
    slot: DOSE_SLOTS.find((item) => item.slot === reminder.slot)?.label ?? '',
    date: reminder.date.split('-').reverse().join('/'),
    time: vietnamTime.format(new Date(reminder.scheduledAt)),
  };
}
