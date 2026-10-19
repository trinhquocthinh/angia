import { budgetMonth, type FamilyExtractionCap } from '@angia/contracts';
import type { FamilyCapDependencies } from './familyCapPorts.js';
import { toFamilyExtractionCap } from './toFamilyExtractionCap.js';

// SPEC-031: màn /admin — trần hiệu lực và chi tiêu tháng (giờ VN) của mọi gia đình, cũ nhất trước.
export async function listFamilyExtractionCaps(deps: FamilyCapDependencies): Promise<FamilyExtractionCap[]> {
  const month = budgetMonth(deps.now());
  const rows = await deps.repository.list(month);
  return rows.map((row) => toFamilyExtractionCap(row, month, deps.defaultFamilyCapUsd));
}
