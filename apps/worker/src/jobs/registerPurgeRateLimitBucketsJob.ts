import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type { RateLimitCleanupDependencies } from '@src/features/rateLimitCleanup/application/ports.js';
import { purgeRateLimitBuckets } from '@src/features/rateLimitCleanup/application/purgeRateLimitBuckets.js';

export async function registerPurgeRateLimitBucketsJob(
  boss: PgBoss,
  deps: RateLimitCleanupDependencies,
  logger: Pick<Logger, 'info' | 'error'>,
): Promise<void> {
  const queue = 'purge-rate-limit-buckets';
  await boss.createQueue(queue, { policy: 'singleton', retryLimit: 3, expireInSeconds: 3600 });
  await boss.schedule(queue, '7 * * * *', null, { tz: 'Asia/Ho_Chi_Minh' });
  await boss.work(queue, { batchSize: 1 }, async ([job]) => {
    if (!job) return;
    try {
      const result = await purgeRateLimitBuckets(deps);
      logger.info(result, 'Đã dọn bucket giới hạn tần suất hết hạn');
    } catch {
      logger.error({ failed: 1 }, 'Không thể dọn bucket giới hạn tần suất hết hạn');
      throw new Error('purge_rate_limit_buckets_failed');
    }
  });
}
