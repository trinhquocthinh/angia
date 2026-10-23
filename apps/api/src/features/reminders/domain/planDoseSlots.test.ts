import { describe, expect, it } from 'vitest';
import { planDoseSlots } from './planDoseSlots.js';

describe('Kiểm thứ tự khung giờ buổi (SPEC-025, BR-036)', () => {
  it('TC-067: sáng 07:00 và tối 19:00 tạo hai khung giờ theo thứ tự buổi', () => {
    expect(planDoseSlots({ evening: '19:00', morning: '07:00' })).toEqual({
      ok: true,
      value: [
        { slot: 'morning', time: '07:00' },
        { slot: 'evening', time: '19:00' },
      ],
    });
  });
  it('TC-068: sáng 20:00 sau tối 19:00 bị từ chối', () => {
    expect(planDoseSlots({ morning: '20:00', evening: '19:00' })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });
  it('TC-068: hai buổi cùng giờ hoặc buổi giữa lùi giờ đều bị từ chối', () => {
    expect(planDoseSlots({ morning: '07:00', noon: '07:00' })).toMatchObject({ ok: false });
    expect(
      planDoseSlots({ morning: '07:00', noon: '12:00', afternoon: '11:59', evening: '19:00' }),
    ).toMatchObject({
      ok: false,
    });
  });
  it('đủ 4 buổi tăng dần hợp lệ; không buổi nào là cấu hình rỗng', () => {
    expect(
      planDoseSlots({ morning: '06:30', noon: '11:30', afternoon: '17:00', evening: '21:00' }),
    ).toMatchObject({ ok: true, value: { length: 4 } });
    expect(planDoseSlots({})).toEqual({ ok: true, value: [] });
  });
});
