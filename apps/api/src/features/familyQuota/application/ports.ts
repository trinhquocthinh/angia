import type { AiBudgetSnapshot } from '../domain/evaluateAiBudget.js';
import type { QuotaLimits, UsageCounts } from '../domain/FamilyQuota.js';

export interface QuotaPolicy {
  limits: QuotaLimits;
  now(): Date;
}
/** Đọc mức dùng của gia đình trong transaction đang mở; `lock` = khóa quota theo gia đình trước khi đếm. */
export type ReadQuotaUsage = (dayStart: Date, lock: boolean) => Promise<UsageCounts>;
/** SPEC-031: tham số ngân sách AI — phải trùng giá trị env của worker. */
export interface AiBudgetPolicy {
  estimatedCostUsd: number;
  defaultMonthlyCapUsd: number;
  defaultFamilyCapUsd: number;
  /** CP5.5: lượt mặc định khi gia đình chưa có dòng quota tháng. */
  defaultMonthlyScans: number;
  now(): Date;
}
export interface FamilyUsageRepository {
  read(familyId: string, dayStart: Date): Promise<UsageCounts>;
  readAiBudget(familyId: string, month: string, policy: AiBudgetPolicy): Promise<AiBudgetSnapshot>;
}
export interface FamilyUsageDependencies {
  repository: FamilyUsageRepository;
  quota: QuotaPolicy;
  ai: AiBudgetPolicy;
}
