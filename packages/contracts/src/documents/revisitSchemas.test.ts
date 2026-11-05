import { describe, expect, it } from 'vitest';
import { revisitQuerySchema, setRevisitDateSchema } from './revisitSchemas.js';

describe('Hợp đồng lịch tái khám (SPEC-043)', () => {
  it('TC-473: from tùy chọn nhưng phải là ngày thực', () => {
    expect(revisitQuerySchema.parse({})).toEqual({});
    expect(revisitQuerySchema.safeParse({ from: '2026-02-30' }).success).toBe(false);
    expect(revisitQuerySchema.parse({ from: '2026-11-20' })).toEqual({ from: '2026-11-20' });
  });
  it('TC-474: bắt buộc gửi trường ngày, null được phép, ngày sai bị chặn', () => {
    expect(setRevisitDateSchema.safeParse({}).success).toBe(false);
    expect(setRevisitDateSchema.safeParse({ revisitDate: '2026-02-30' }).success).toBe(false);
    expect(setRevisitDateSchema.parse({ revisitDate: null })).toEqual({ revisitDate: null });
  });
});
