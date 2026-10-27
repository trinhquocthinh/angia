import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type {
  BillingReader,
  BillingRepository,
  BillingSource,
} from '@src/features/aiBilling/application/ports.js';
import { syncProviderBilling } from '@src/features/aiBilling/application/syncProviderBilling.js';
export async function registerSyncProviderBillingJob(
  boss: PgBoss,
  sources: BillingSource[],
  repository: BillingRepository,
  reader: BillingReader,
  logger: Logger,
): Promise<void> {
  const name = 'sync-provider-billing';
  await boss.createQueue(name, { policy: 'singleton', retryLimit: 0, expireInSeconds: 120 });
  await boss.schedule(name, '* * * * *', null, { tz: 'Asia/Ho_Chi_Minh' });
  await boss.work(name, { batchSize: 1 }, async ([job]) => {
    if (!job) return;
    try {
      await syncProviderBilling(sources, repository, reader);
    } catch {
      logger.warn({ code: 'billing_sync_failed' }, 'Không thể đồng bộ phí nhà cung cấp');
    }
  });
}
