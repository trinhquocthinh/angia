import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { myReminderSchema } from './myReminderSchemas.js';

const reminder = {
  id: randomUUID(),
  date: '2026-10-23',
  slot: 'morning',
  scheduledAt: '2026-10-23T00:00:00.000Z',
  profileName: 'Mẹ',
  medications: [
    { name: 'Canxi', strength: '500 mg', quantityPerDose: '1', doseUnit: 'viên' },
    { name: 'Vitamin D', strength: null, quantityPerDose: null, doseUnit: null },
  ],
};

describe('Hợp đồng lời nhắc cá nhân (SPEC-035)', () => {
  it('TC-344: nhận lời nhắc gồm ngày, buổi, giờ hẹn, tên hồ sơ và thuốc', () => {
    expect(myReminderSchema.parse(reminder)).toEqual(reminder);
  });
  it('TC-344: bỏ courseId khỏi thuốc, không giữ trường ngoài hợp đồng', () => {
    const medications = [{ ...reminder.medications[0], courseId: randomUUID() }];
    const parsed = myReminderSchema.parse({ ...reminder, medications });
    expect(parsed.medications[0]).not.toHaveProperty('courseId');
  });
  it('từ chối buổi lạ, ngày sai định dạng và danh sách thuốc rỗng', () => {
    for (const body of [
      { ...reminder, slot: 'as_needed' },
      { ...reminder, date: '23/10/2026' },
      { ...reminder, scheduledAt: 'hôm nay' },
      { ...reminder, medications: [] },
      { ...reminder, id: 'not-uuid' },
    ]) {
      expect(myReminderSchema.safeParse(body).success).toBe(false);
    }
  });
});
