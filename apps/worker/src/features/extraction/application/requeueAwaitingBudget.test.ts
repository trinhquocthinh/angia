import { describe, expect, it } from 'vitest';
import type { BudgetCall } from './ports.js';
import { requeueAwaitingBudget } from './requeueAwaitingBudget.js';

const call: BudgetCall = {
  month: '2026-11',
  defaultMonthlyCapUsd: 5,
  defaultMonthlyScans: 0,
};

function repository(counts: Record<string, number>) {
  const scoped: string[] = [];
  const calls: BudgetCall[] = [];
  let listed = 0;
  return {
    scoped,
    calls,
    listed: () => listed,
    repo: {
      listFamilyIds: async () => {
        listed += 1;
        return Object.keys(counts);
      },
      requeueFamily: async (familyId: string, budget: BudgetCall) => {
        scoped.push(familyId);
        calls.push(budget);
        return counts[familyId] ?? 0;
      },
    },
  };
}

describe('Đưa chứng từ awaiting_budget vào lại hàng đợi (TC-030, BR-018, SPEC-031)', () => {
  it('cron đầu tháng: duyệt từng gia đình trong phạm vi riêng và cộng số chứng từ được đưa lại', async () => {
    const r = repository({ 'family-a': 2, 'family-b': 0, 'family-c': 1 });
    expect(await requeueAwaitingBudget(r.repo, { call })).toEqual({ families: 3, requeued: 3 });
    expect(r.scoped).toEqual(['family-a', 'family-b', 'family-c']);
    expect(r.calls.every((c) => c === call)).toBe(true);
  });

  it('TC-307: quản trị nâng trần một gia đình → chỉ xử lý gia đình đó, không liệt kê cả hệ thống', async () => {
    const r = repository({ 'family-a': 2, 'family-b': 5 });
    expect(await requeueAwaitingBudget(r.repo, { familyId: 'family-a', call })).toEqual({
      families: 1,
      requeued: 2,
    });
    expect(r.scoped).toEqual(['family-a']);
    expect(r.listed()).toBe(0);
  });
});
