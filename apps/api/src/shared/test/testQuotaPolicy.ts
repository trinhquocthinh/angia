import type { AiBudgetPolicy, QuotaPolicy } from '@src/features/familyQuota/application/ports.js';

// Ngưỡng mặc định của env (SPEC-030); rate limit nới rộng để test các feature khác không bị 429.
export const TEST_QUOTA_POLICY: QuotaPolicy = {
  limits: { storageBytes: 2 * 1024 * 1024 * 1024, dailyUploads: 100, pendingJobs: 10 },
  now: () => new Date(),
};
export const TEST_HEAVY_RATE_LIMIT = { perMinute: 1000, now: () => Date.now() };
// Giá trị env mặc định của trần AI (SPEC-031).
export const TEST_AI_POLICY: AiBudgetPolicy = {
  defaultMonthlyCapUsd: 5,
  defaultMonthlyScans: 10,
  now: () => new Date(),
};
