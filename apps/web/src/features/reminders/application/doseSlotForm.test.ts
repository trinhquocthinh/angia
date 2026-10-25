import { describe, expect, it } from 'vitest';
import { toDoseSlotForm, validateDoseSlotForm } from './doseSlotForm';

const emptyDoseSlotForm = { morning: '', noon: '', afternoon: '', evening: '' };

describe('Form khung giờ buổi (SPEC-025)', () => {
  it('TC-067: Sáng 07:00, Tối 19:00 hợp lệ; ô trống không gửi lên', () => {
    expect(validateDoseSlotForm({ ...emptyDoseSlotForm, morning: '07:00', evening: '19:00' })).toEqual({
      ok: true,
      slots: { morning: '07:00', evening: '19:00' },
    });
  });
  it('TC-068: Sáng 20:00 sau Tối 19:00 báo lỗi thứ tự tại buổi Tối', () => {
    expect(validateDoseSlotForm({ ...emptyDoseSlotForm, morning: '20:00', evening: '19:00' })).toEqual({
      ok: false,
      slot: 'evening',
      message: 'Giờ buổi Tối phải sau buổi Sáng (20:00).',
    });
  });
  it('trình duyệt trả giờ kèm giây vẫn chuẩn hóa về HH:mm', () => {
    expect(validateDoseSlotForm({ ...emptyDoseSlotForm, noon: '11:30:00' })).toEqual({
      ok: true,
      slots: { noon: '11:30' },
    });
  });
  it('dựng form từ dữ liệu đã lưu, buổi chưa có để trống', () => {
    expect(toDoseSlotForm([{ slot: 'noon', time: '11:30' }])).toEqual({
      ...emptyDoseSlotForm,
      noon: '11:30',
    });
  });
});
