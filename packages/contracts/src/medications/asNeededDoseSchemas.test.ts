import { describe, expect, it } from 'vitest';
import {
  asNeededDoseQuerySchema,
  recordAsNeededDoseRequestSchema,
  setCourseIntervalRequestSchema,
} from './asNeededDoseSchemas.js';

const courseId = '0190a000-0000-7000-8000-000000000001';

describe('Hợp đồng nhật ký liều "Khi cần" (SPEC-047)', () => {
  it('TC-498: số lượng 0, âm hoặc > 1000 và đơn vị > 20 ký tự bị từ chối', () => {
    const base = { courseId, givenAt: '2026-11-03T14:00:00+07:00' };
    expect(recordAsNeededDoseRequestSchema.parse(base)).toEqual({ ...base, quantity: null, unit: null });
    expect(recordAsNeededDoseRequestSchema.safeParse({ ...base, quantity: 1000 }).success).toBe(true);
    for (const body of [
      { ...base, quantity: 0 },
      { ...base, quantity: -1 },
      { ...base, quantity: 1000.5 },
      { ...base, unit: 'x'.repeat(21) },
      { ...base, givenAt: '2026-11-03' },
      { ...base, nextDoseAt: '2026-11-03T18:00:00Z' },
    ]) {
      expect(recordAsNeededDoseRequestSchema.safeParse(body).success).toBe(false);
    }
  });
  it('SPEC-047: khoảng đọc từ 1 đến 366 ngày', () => {
    expect(asNeededDoseQuerySchema.safeParse({ from: '2026-01-01', to: '2027-01-01' }).success).toBe(true);
    expect(asNeededDoseQuerySchema.safeParse({ from: '2026-01-01', to: '2027-01-02' }).success).toBe(false);
    expect(asNeededDoseQuerySchema.safeParse({ from: '2026-01-02', to: '2026-01-01' }).success).toBe(false);
  });
  it('TC-496: khoảng cách người dùng nhập 1–100 ký tự hoặc null để xóa', () => {
    expect(setCourseIntervalRequestSchema.parse({ text: ' cách 6 giờ ' })).toEqual({ text: 'cách 6 giờ' });
    expect(setCourseIntervalRequestSchema.parse({ text: null })).toEqual({ text: null });
    expect(setCourseIntervalRequestSchema.safeParse({ text: ' ' }).success).toBe(false);
    expect(setCourseIntervalRequestSchema.safeParse({ text: 'x'.repeat(101) }).success).toBe(false);
  });
});
