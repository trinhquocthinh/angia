import { budgetMonth, type FamilyUsage } from '@angia/contracts';
import { evaluateAiBudget } from '../domain/evaluateAiBudget.js';
import { vietnamMidnightIso } from '../domain/vietnamMidnightIso.js';
import { vietnamDayBounds } from '../domain/vietnamDayBounds.js';
import type { FamilyUsageDependencies } from './ports.js';

// SPEC-030: mức đã dùng / trần cho thẻ "Mức sử dụng của gia đình"; mốc reset dùng chung định dạng với lỗi quota.
export async function getFamilyUsage(deps: FamilyUsageDependencies, familyId: string): Promise<FamilyUsage> {
  const { start, end } = vietnamDayBounds(deps.quota.now());
  const usage = await deps.repository.read(familyId, start);
  const month = budgetMonth(deps.ai.now());
  const budget = await deps.repository.readAiBudget(familyId, month, deps.ai);
  const { limits } = deps.quota;
  const resetsAt = vietnamMidnightIso(end);
  return {
    storage: { usedBytes: usage.storageBytes, limitBytes: limits.storageBytes },
    dailyUploads: { used: usage.uploadsToday, limit: limits.dailyUploads, resetsAt },
    pendingJobs: { used: usage.pendingJobs, limit: limits.pendingJobs },
    aiOcr: { month, ...evaluateAiBudget(budget) },
  };
}
