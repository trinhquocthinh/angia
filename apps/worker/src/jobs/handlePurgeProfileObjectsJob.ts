import { purgeProfileObjectsJobSchema } from '@angia/contracts';
import type { Logger } from 'pino';
import type { PurgeDependencies } from '@src/features/purgeProfileObjects/application/ports.js';
import { purgeProfileObjects } from '@src/features/purgeProfileObjects/application/purgeProfileObjects.js';

// Payload sai không retry (lặp lại cũng sai). Log chỉ uuid và số đếm, không ghi khóa object (BR-010).
export function handlePurgeProfileObjectsJob(
  deps: PurgeDependencies,
  logger: Pick<Logger, 'info' | 'error'>,
) {
  return async (job: { id: string; data: unknown }) => {
    const parsed = purgeProfileObjectsJobSchema.safeParse(job.data);
    if (!parsed.success) {
      logger.error({ jobId: job.id }, 'Payload dọn ảnh hồ sơ không hợp lệ');
      return;
    }
    const result = await purgeProfileObjects(deps, parsed.data);
    logger.info({ jobId: job.id, ...parsed.data, ...result }, 'Đã vét ảnh của hồ sơ đã xóa');
  };
}
