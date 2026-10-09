import { describe, expect, it } from 'vitest';
import { suggestDurationDays, type DurationInputs } from './suggestDurationDays';

const inputs = (patch: Partial<DurationInputs> = {}): DurationInputs => ({
  totalQuantity: '30',
  quantityPerDose: '1',
  slots: ['morning', 'evening'],
  durationDays: '',
  longTerm: false,
  ...patch,
});

describe('Gợi ý số ngày dùng từ tổng số lượng (BR-025 ngoại lệ có xác nhận)', () => {
  it('Số ngày = Tổng số lượng ÷ (Mỗi lần × Số buổi) khi chia hết', () => {
    expect(suggestDurationDays(inputs())).toEqual({ days: 15, total: 30, perDose: 1, slotCount: 2 });
    expect(
      suggestDurationDays(inputs({ totalQuantity: '10', quantityPerDose: '0,5', slots: ['noon'] })),
    ).toMatchObject({ days: 20 });
  });

  it('không gợi ý khi phép chia không ra số nguyên dương', () => {
    expect(suggestDurationDays(inputs({ totalQuantity: '25' }))).toBeNull();
    expect(suggestDurationDays(inputs({ totalQuantity: '1', quantityPerDose: '2' }))).toBeNull();
  });

  it('không gợi ý khi thiếu dữ liệu, bật Dài hạn hoặc đã có số ngày', () => {
    expect(suggestDurationDays(inputs({ totalQuantity: '' }))).toBeNull();
    expect(suggestDurationDays(inputs({ quantityPerDose: 'abc' }))).toBeNull();
    expect(suggestDurationDays(inputs({ slots: [] }))).toBeNull();
    expect(suggestDurationDays(inputs({ longTerm: true }))).toBeNull();
    expect(suggestDurationDays(inputs({ durationDays: '10' }))).toBeNull();
  });
});
