import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type { DeletedUsernameCleanupDependencies } from '@src/features/deletedUsernameCleanup/application/ports.js';
import { purgeDeletedUsernames } from '@src/features/deletedUsernameCleanup/application/purgeDeletedUsernames.js';

export async function registerPurgeDeletedUsernamesJob(
  boss: PgBoss,
  deps: DeletedUsernameCleanupDependencies,
  logger: Pick<Logger, 'info' | 'error'>,
): Promise<void> {
  const queue = 'purge-deleted-usernames';
  await boss.createQueue(queue, { policy: 'singleton', retryLimit: 3, expireInSeconds: 3600 });
  await boss.schedule(queue, '0 4 * * *', null, { tz: 'Asia/Ho_Chi_Minh' });
  await boss.work(queue, { batchSize: 1 }, async ([job]) => {
    if (!job) return;
    try {
      const result = await purgeDeletedUsernames(deps);
      logger.info(result, 'Đã dọn tên đăng nhập hết thời gian giữ');
    } catch {
      logger.error({ failed: 1 }, 'Không thể dọn tên đăng nhập hết thời gian giữ');
      throw new Error('purge_deleted_usernames_failed');
    }
  });
}
