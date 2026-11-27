import { describe, expect, it } from 'vitest';
import { getAdminStats } from './getAdminStats.js';

describe('SPEC-077: đọc thống kê', () => {
  it('TC-843: trả đúng các tuần từ repository', async () => {
    const weeks = [
      {
        weekStart: '2026-11-23',
        families: 3,
        accounts: 4,
        familiesWithDoseConfirmation: 1,
        familiesActiveStreak4w: 1,
      },
    ];
    const result = await getAdminStats(
      {
        weekly: async (count) => {
          expect(count).toBe(4);
          return weeks;
        },
      },
      4,
    );
    expect(result).toEqual({ weeks });
  });
});
