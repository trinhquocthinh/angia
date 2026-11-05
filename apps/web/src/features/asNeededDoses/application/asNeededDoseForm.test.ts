import { describe, expect, it } from 'vitest';
import { asNeededDoseFormSchema } from './asNeededDoseForm';

const course = { id: '00000000-0000-4000-8000-000000000001', startDate: '2026-11-01', endDate: '2026-11-04' };
const now = new Date('2026-11-04T08:00:00Z');
const values = { givenAt: '2026-11-04T14:00', quantity: '', unit: '' };
describe('Form ghi liều Khi cần', () => {
  it('TC-495: đổi giờ Việt Nam độc lập múi giờ thiết bị; không tự điền liều', () => {
    expect(asNeededDoseFormSchema(course, now).parse(values)).toEqual({
      courseId: course.id,
      givenAt: '2026-11-04T07:00:00.000Z',
      quantity: null,
      unit: null,
    });
  });
  it('TC-498: nhận dấu phẩy và giữ ba số lẻ', () => {
    expect(
      asNeededDoseFormSchema(course, now).parse({ ...values, quantity: '0,125', unit: ' ml ' }),
    ).toMatchObject({ quantity: 0.125, unit: 'ml' });
  });
  it.each(['0', '-1', '1000,001', 'abc', 'Infinity'])('TC-498: chặn số lượng %s', (quantity) => {
    expect(asNeededDoseFormSchema(course, now).safeParse({ ...values, quantity }).success).toBe(false);
  });
  it.each(['2026-10-31T23:59', '2026-11-04T15:01', '2026-11-05T00:00', '2026-02-30T12:00', ''])(
    'TC-497/498: chặn thời điểm %s',
    (givenAt) => {
      expect(asNeededDoseFormSchema(course, now).safeParse({ ...values, givenAt }).success).toBe(false);
    },
  );
  it('TC-498: đơn vị tối đa 20 ký tự và nhận biên 1000', () => {
    const schema = asNeededDoseFormSchema(course, now);
    expect(schema.safeParse({ ...values, unit: 'x'.repeat(21) }).success).toBe(false);
    expect(schema.parse({ ...values, quantity: '1000' }).quantity).toBe(1000);
    expect(schema.safeParse({ ...values, givenAt: '2026-11-01T00:00' }).success).toBe(true);
  });
});
