import { prepareOcrImageJobSchema } from '@angia/contracts';
import type { Logger } from 'pino';
import type { PrivacyDependencies } from '@src/features/documentPrivacy/application/ports.js';
import { prepareOcrImage } from '@src/features/documentPrivacy/application/prepareOcrImage.js';
interface PrivacyQueueJob {
  id: string;
  data: unknown;
  retryCount: number;
  retryLimit: number;
}
export function handlePrepareOcrImageJob(deps: PrivacyDependencies, logger: Logger) {
  return async (job: PrivacyQueueJob) => {
    const payload = prepareOcrImageJobSchema.parse(job.data);
    try {
      const result = await prepareOcrImage(deps, {
        ...payload,
        finalAttempt: job.retryCount >= job.retryLimit,
      });
      logger.info(
        { jobId: job.id, documentId: payload.documentId, ...result },
        'Đã xử lý job prepare-ocr-image',
      );
      return result;
    } catch (error) {
      logger.warn(
        {
          jobId: job.id,
          documentId: payload.documentId,
          retryCount: job.retryCount,
          reason: 'prepare_failed',
        },
        'Tạo bản ảnh kiểm tra lỗi, pg-boss sẽ thử lại',
      );
      throw error;
    }
  };
}
