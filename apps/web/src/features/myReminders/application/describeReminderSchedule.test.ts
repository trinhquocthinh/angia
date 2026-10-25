import { describe, expect, it } from 'vitest';
import { describeReminderSchedule } from './describeReminderSchedule';

describe('Thời điểm lời nhắc', () => {
  it('nhãn buổi tiếng Việt, ngày lịch giữ nguyên, giờ theo Asia/Ho_Chi_Minh', () => {
    expect(
      describeReminderSchedule({
        slot: 'evening',
        date: '2026-10-23',
        scheduledAt: '2026-10-23T13:30:00.000Z',
      }),
    ).toEqual({ slot: 'Tối', date: '23/10/2026', time: '20:30' });
  });
  it('giờ UTC tối hôm trước vẫn hiện giờ sáng Việt Nam', () => {
    expect(
      describeReminderSchedule({
        slot: 'morning',
        date: '2026-10-24',
        scheduledAt: '2026-10-23T23:15:00.000Z',
      }),
    ).toEqual({ slot: 'Sáng', date: '24/10/2026', time: '06:15' });
  });
});
