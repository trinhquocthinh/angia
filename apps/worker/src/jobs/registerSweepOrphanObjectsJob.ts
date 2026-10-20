import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type { SweepDependencies, SweepPolicy } from '@src/features/orphanObjects/application/ports.js';
import { handleSweepOrphanObjectsJob } from './handleSweepOrphanObjectsJob.js';

// BR-044: 03:00 hằng ngày giờ Việt Nam (owner chốt 2026-10-20). API không gửi job này nên hằng nằm ở worker.
const SWEEP_ORPHAN_OBJECTS_QUEUE = 'sweep-orphan-objects';
const DAILY_CRON = '0 3 * * *';

// singleton: mỗi lúc một lần quét; retryLimit 0 vì use case không ném lỗi, lần chạy hôm sau làm lại.
// expireInSeconds 4 giờ thay mặc định 15 phút của pg-boss; hết hạn → job.signal hủy, quét dừng giữa các gia đình.
export async function registerSweepOrphanObjectsJob(
  boss: PgBoss,
  deps: SweepDependencies,
  policy: SweepPolicy,
  logger: Logger,
): Promise<void> {
  await boss.createQueue(SWEEP_ORPHAN_OBJECTS_QUEUE, {
    policy: 'singleton',
    retryLimit: 0,
    expireInSeconds: 14_400,
  });
  await boss.schedule(SWEEP_ORPHAN_OBJECTS_QUEUE, DAILY_CRON, null, { tz: 'Asia/Ho_Chi_Minh' });
  const handle = handleSweepOrphanObjectsJob(deps, policy, logger);
  await boss.work(SWEEP_ORPHAN_OBJECTS_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (job) await handle(job);
  });
}
