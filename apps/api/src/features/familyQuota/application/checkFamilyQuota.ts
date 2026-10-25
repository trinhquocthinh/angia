import { evaluateFamilyQuota } from '../domain/evaluateFamilyQuota.js';
import type { QuotaRequest, QuotaResult } from '../domain/FamilyQuota.js';
import { vietnamDayBounds } from '../domain/vietnamDayBounds.js';
import type { QuotaPolicy, ReadQuotaUsage } from './ports.js';

// SPEC-030: ghi có quota gọi trong transaction ghi với lock = true để lô đồng thời của cùng gia đình xếp hàng.
export async function checkFamilyQuota(
  read: ReadQuotaUsage,
  policy: QuotaPolicy,
  request: QuotaRequest,
  lock: boolean,
): Promise<QuotaResult> {
  const { start, end } = vietnamDayBounds(policy.now());
  return evaluateFamilyQuota(await read(start, lock), request, policy.limits, end);
}
