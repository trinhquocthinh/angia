import { purgePendingObjectsJobSchema } from '@angia/contracts';
import type { Logger } from 'pino';
import type { ObjectPurgeDependencies } from '@src/features/objectPurges/application/ports.js';
import { purgePendingObjects } from '@src/features/objectPurges/application/purgePendingObjects.js';

export function handlePurgePendingObjectsJob(
  deps: ObjectPurgeDependencies,
  logger: Pick<Logger, 'info' | 'warn' | 'error'>,
) {
  return async (job: { id: string; data: unknown; signal: AbortSignal }) => {
    if (!purgePendingObjectsJobSchema.safeParse(job.data).success) {
      logger.error({ jobId: job.id }, 'Payload dọn object không hợp lệ');
      return;
    }
    let result: { deleted: number; failed: number };
    try {
      result = await purgePendingObjects(
        { ...deps, signal: job.signal },
        { batchSize: 100, maxAttempts: 10 },
      );
    } catch {
      // pg-boss lưu lỗi job: không chuyển raw message có thể chứa khóa object/PII.
      throw new Error('object_purges_unavailable');
    }
    const summary = { jobId: job.id, ...result, aborted: job.signal.aborted };
    if (result.failed || job.signal.aborted) logger.warn(summary, 'Dọn object còn tồn hoặc bị hủy');
    else logger.info(summary, 'Đã dọn object chờ xóa');
    if (result.failed && !job.signal.aborted) throw new Error('object_purges_failed');
  };
}
