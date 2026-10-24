import { PURGE_PROFILE_OBJECTS_QUEUE, PURGE_PROFILE_OBJECTS_QUEUE_OPTIONS } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type { PurgeDependencies } from '@src/features/purgeProfileObjects/application/ports.js';
import { handlePurgeProfileObjectsJob } from './handlePurgeProfileObjectsJob.js';

// SPEC-007: API enqueue cùng transaction xóa hồ sơ (trễ 10 phút); API cũng createQueue cùng options.
export async function registerPurgeProfileObjectsJob(
  boss: PgBoss,
  deps: PurgeDependencies,
  logger: Logger,
): Promise<void> {
  await boss.createQueue(PURGE_PROFILE_OBJECTS_QUEUE, PURGE_PROFILE_OBJECTS_QUEUE_OPTIONS);
  const handle = handlePurgeProfileObjectsJob(deps, logger);
  await boss.work(PURGE_PROFILE_OBJECTS_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (job) await handle(job);
  });
}
