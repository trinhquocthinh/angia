import { describe, expect, it } from 'vitest';
import { requeueAwaitingBudget } from './requeueAwaitingBudget.js';

describe('Đầu tháng đưa chứng từ awaiting_budget vào lại hàng đợi (TC-030, BR-018)', () => {
  it('duyệt từng gia đình trong phạm vi riêng và cộng số chứng từ được đưa lại', async () => {
    const scoped: string[] = [];
    const counts: Record<string, number> = { 'family-a': 2, 'family-b': 0, 'family-c': 1 };
    const result = await requeueAwaitingBudget({
      listFamilyIds: async () => Object.keys(counts),
      requeueFamily: async (familyId) => {
        scoped.push(familyId);
        return counts[familyId] ?? 0;
      },
    });
    expect(result).toEqual({ families: 3, requeued: 3 });
    expect(scoped).toEqual(['family-a', 'family-b', 'family-c']);
  });
});
