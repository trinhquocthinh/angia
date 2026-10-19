import { budgetMonth, type FamilyExtractionCap } from '@angia/contracts';
import type { FamilyCapDependencies } from './familyCapPorts.js';
import { toFamilyExtractionCap } from './toFamilyExtractionCap.js';

// SPEC-031: hạ trần không đổi trạng thái chứng từ (lần giữ chỗ kế tiếp tự chặn); nâng trần hiệu lực thì đưa
// chứng từ awaiting_budget của riêng gia đình đó vào lại hàng đợi ngay. null = về mặc định.
export async function setFamilyExtractionCap(
  deps: FamilyCapDependencies,
  familyId: string,
  capUsd: number | null,
): Promise<FamilyExtractionCap | null> {
  const month = budgetMonth(deps.now());
  return deps.repository.inTransaction(familyId, async (store) => {
    const current = await store.lockFamily(familyId);
    if (!current) return null;
    const before = current.capUsd ?? deps.defaultFamilyCapUsd;
    const after = capUsd ?? deps.defaultFamilyCapUsd;
    await store.setCap(familyId, capUsd);
    if (after > before) await store.requestRequeue(familyId);
    const spentUsd = await store.readSpent(familyId, month);
    return toFamilyExtractionCap(
      { familyId, familyName: current.familyName, capUsd, spentUsd },
      month,
      deps.defaultFamilyCapUsd,
    );
  });
}
