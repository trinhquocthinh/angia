import { describe, expect, it } from 'vitest';
import type { AiBudgetDependencies, AiBudgetMonth } from './aiBudgetPorts.js';
import { getAiBudget } from './getAiBudget.js';
import { setAiBudget } from './setAiBudget.js';

// 2026-10-31 17:30 UTC = 00:30 ngày 01/11 giờ Việt Nam → tháng ngân sách 2026-11.
const NOW = new Date('2026-10-31T17:30:00Z');

function memoryBudget(months: Record<string, AiBudgetMonth> = {}) {
  const requeues: string[] = [];
  const latestCap = () => Object.entries(months).sort(([a], [b]) => b.localeCompare(a))[0]?.[1].capUsd;
  const deps: AiBudgetDependencies = {
    defaultMonthlyCapUsd: 5,
    now: () => NOW,
    repository: {
      read: async (month, defaultCapUsd) =>
        months[month] ?? { capUsd: latestCap() ?? defaultCapUsd, spentUsd: 0 },
      inTransaction: (work) =>
        work({
          lockMonth: async (month, defaultCapUsd) =>
            (months[month] ??= { capUsd: latestCap() ?? defaultCapUsd, spentUsd: 0 }),
          setCap: async (month, capUsd) => {
            months[month] = { spentUsd: months[month]?.spentUsd ?? 0, capUsd };
          },
          requestRequeue: async () => {
            requeues.push('requeue');
          },
        }),
    },
  };
  return { deps, months, requeues };
}

describe('Trần ngân sách AI (SPEC-013, BR-018)', () => {
  it('đọc tháng hiện tại theo giờ Việt Nam; tháng chưa có dòng lấy trần tháng gần nhất, đã dùng 0', async () => {
    const { deps } = memoryBudget({ '2026-10': { capUsd: 3, spentUsd: 2.5 } });
    expect(await getAiBudget(deps)).toEqual({ month: '2026-11', monthlyCapUsd: 3, spentThisMonthUsd: 0 });
  });

  it('chưa có tháng nào → trần mặc định AI_DEFAULT_MONTHLY_CAP_USD', async () => {
    expect(await getAiBudget(memoryBudget().deps)).toMatchObject({ monthlyCapUsd: 5 });
  });

  it('TC-041: đã dùng $3.00, hạ trần còn $2.00 → lưu trần mới, không đưa lại hàng đợi', async () => {
    const { deps, months, requeues } = memoryBudget({ '2026-11': { capUsd: 5, spentUsd: 3 } });
    expect(await setAiBudget(deps, { monthlyCapUsd: 2 })).toEqual({
      month: '2026-11',
      monthlyCapUsd: 2,
      spentThisMonthUsd: 3,
    });
    expect(months['2026-11']).toEqual({ capUsd: 2, spentUsd: 3 });
    expect(requeues).toEqual([]);
  });

  it('nâng trần → yêu cầu đưa chứng từ awaiting_budget vào lại hàng đợi (chủ dự án chốt 2026-10-10)', async () => {
    const { deps, requeues } = memoryBudget({ '2026-11': { capUsd: 2, spentUsd: 3 } });
    await setAiBudget(deps, { monthlyCapUsd: 4 });
    expect(requeues).toHaveLength(1);
  });

  it('giữ nguyên trần → không đưa lại hàng đợi; tháng chưa có dòng được tạo rồi ghi trần', async () => {
    const { deps, months, requeues } = memoryBudget({ '2026-10': { capUsd: 5, spentUsd: 1 } });
    await setAiBudget(deps, { monthlyCapUsd: 5 });
    expect(requeues).toEqual([]);
    expect(months['2026-11']).toEqual({ capUsd: 5, spentUsd: 0 });
  });
});
