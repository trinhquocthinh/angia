import type { RateLimitCleanupDependencies } from './ports.js';

export async function purgeRateLimitBuckets(
  deps: RateLimitCleanupDependencies,
): Promise<{ removed: number }> {
  return { removed: await deps.repository.removeExpired() };
}
