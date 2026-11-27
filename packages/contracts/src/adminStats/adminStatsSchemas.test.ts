import { describe, expect, it } from 'vitest';
import { adminStatsQuerySchema, adminStatsResponseSchema } from './adminStatsSchemas.js';

describe('SPEC-077: hợp đồng thống kê', () => {
  it('TC-844: giới hạn 1–52 tuần, mặc định 12', () => {
    expect(adminStatsQuerySchema.parse({})).toEqual({ weeks: 12 });
    for (const weeks of [0, 53, 1.5, 'sai'])
      expect(adminStatsQuerySchema.safeParse({ weeks }).success).toBe(false);
  });
  it('TC-844: chỉ nhận ngày và số nguyên không âm, từ chối trường thừa', () => {
    const week = {
      weekStart: '2026-11-23',
      families: 3,
      accounts: 4,
      familiesWithDoseConfirmation: 1,
      familiesActiveStreak4w: 1,
    };
    expect(adminStatsResponseSchema.parse({ weeks: [week] })).toEqual({ weeks: [week] });
    for (const extra of [{ accounts: -1 }, { families: 1.5 }, { name: 'Nhà' }, { weekStart: '2026-02-30' }])
      expect(adminStatsResponseSchema.safeParse({ weeks: [{ ...week, ...extra }] }).success).toBe(false);
  });
});
