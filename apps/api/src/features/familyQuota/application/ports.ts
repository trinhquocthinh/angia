import type { QuotaLimits, UsageCounts } from '../domain/FamilyQuota.js';

export interface QuotaPolicy {
  limits: QuotaLimits;
  now(): Date;
}
/** Đọc mức dùng của gia đình trong transaction đang mở; `lock` = khóa quota theo gia đình trước khi đếm. */
export type ReadQuotaUsage = (dayStart: Date, lock: boolean) => Promise<UsageCounts>;
export interface FamilyUsageRepository {
  read(familyId: string, dayStart: Date): Promise<UsageCounts>;
}
export interface FamilyUsageDependencies {
  repository: FamilyUsageRepository;
  quota: QuotaPolicy;
}
