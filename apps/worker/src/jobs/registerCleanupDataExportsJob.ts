import { CLEANUP_DATA_EXPORTS_QUEUE, CLEANUP_DATA_EXPORTS_QUEUE_OPTIONS } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import { cleanupDataExports } from '@src/features/dataExportCleanup/application/cleanupDataExports.js';
import type { CleanupDataExportsDependencies } from '@src/features/dataExportCleanup/application/ports.js';

export async function registerCleanupDataExportsJob(
  boss: PgBoss,
  deps: CleanupDataExportsDependencies,
  logger: Pick<Logger, 'info' | 'error'>,
): Promise<void> {
  await boss.createQueue(CLEANUP_DATA_EXPORTS_QUEUE, CLEANUP_DATA_EXPORTS_QUEUE_OPTIONS);
  await boss.schedule(CLEANUP_DATA_EXPORTS_QUEUE, '0 * * * *', null, { tz: 'Asia/Ho_Chi_Minh' });
  await boss.work(CLEANUP_DATA_EXPORTS_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (!job) return;
    try {
      const result = await cleanupDataExports(deps);
      logger.info(result, 'Đã dọn tệp xuất dữ liệu');
      if (result.failed) throw new Error('cleanup_data_exports_failed');
    } catch {
      logger.error({ failed: 1 }, 'Không thể hoàn tất dọn tệp xuất dữ liệu');
      throw new Error('cleanup_data_exports_failed');
    }
  });
}
