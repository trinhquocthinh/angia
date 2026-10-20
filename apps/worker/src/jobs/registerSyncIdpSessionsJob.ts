import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type { IdpSyncDependencies, IdpSyncPolicy } from '@src/features/idpSessionSync/application/ports.js';
import { handleSyncIdpSessionsJob } from './handleSyncIdpSessionsJob.js';

// BR-045: mỗi 5 phút để thu hồi trong SLA 15 phút (owner chốt 2026-10-20). API không gửi job này.
const SYNC_IDP_SESSIONS_QUEUE = 'sync-idp-sessions';
const EVERY_FIVE_MINUTES = '*/5 * * * *';

// singleton: mỗi lúc một lượt; retryLimit 0 vì use case không ném lỗi, lượt 5 phút sau làm lại.
// expireInSeconds 240 < chu kỳ: lượt treo (Authentik timeout 10 s/lần gọi) không chồng lượt kế tiếp.
export async function registerSyncIdpSessionsJob(
  boss: PgBoss,
  deps: IdpSyncDependencies,
  policy: IdpSyncPolicy,
  logger: Logger,
): Promise<void> {
  await boss.createQueue(SYNC_IDP_SESSIONS_QUEUE, {
    policy: 'singleton',
    retryLimit: 0,
    expireInSeconds: 240,
  });
  await boss.schedule(SYNC_IDP_SESSIONS_QUEUE, EVERY_FIVE_MINUTES, null, { tz: 'Asia/Ho_Chi_Minh' });
  const handle = handleSyncIdpSessionsJob(deps, policy, logger);
  await boss.work(SYNC_IDP_SESSIONS_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (job) await handle(job);
  });
}
