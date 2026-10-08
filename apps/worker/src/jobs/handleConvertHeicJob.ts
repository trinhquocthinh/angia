import { convertHeicJobSchema } from '@angia/contracts';
import type { Logger } from 'pino';
import type { PreviewDependencies } from '@src/features/documentPreview/application/ports.js';
import { prepareDocumentPreview } from '@src/features/documentPreview/application/prepareDocumentPreview.js';
interface PreviewQueueJob {
  id: string;
  data: unknown;
  retryCount: number;
  retryLimit: number;
}
export function handleConvertHeicJob(deps: PreviewDependencies, logger: Logger) {
  return async (job: PreviewQueueJob) => {
    const { documentId, familyId } = convertHeicJobSchema.parse(job.data);
    try {
      const result = await prepareDocumentPreview(deps, {
        documentId,
        familyId,
        finalAttempt: job.retryCount >= job.retryLimit,
      });
      logger.info({ jobId: job.id, documentId, ...result }, 'Đã xử lý job convert-heic');
      return result;
    } catch (error) {
      logger.warn(
        { jobId: job.id, documentId, retryCount: job.retryCount, reason: 'preview_failed' },
        'Chuẩn bị ảnh lỗi, pg-boss sẽ thử lại',
      );
      throw error;
    }
  };
}
