import type { QuotaPolicy } from '@src/features/familyQuota/application/ports.js';

// Ngưỡng mặc định của env (SPEC-030); rate limit nới rộng để test các feature khác không bị 429.
export const TEST_QUOTA_POLICY: QuotaPolicy = {
  limits: { storageBytes: 2 * 1024 * 1024 * 1024, dailyUploads: 100, pendingJobs: 10 },
  now: () => new Date(),
};
export const TEST_HEAVY_RATE_LIMIT = { perMinute: 1000, now: () => Date.now() };
