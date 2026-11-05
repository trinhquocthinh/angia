import { sanitizeDocumentImageJobSchema } from '@angia/contracts';
import type { Logger } from 'pino';
import type { SanitizeDependencies } from '@src/features/documentSanitize/application/ports.js';
import { sanitizeDocumentImage } from '@src/features/documentSanitize/application/sanitizeDocumentImage.js';

interface SanitizeQueueJob {
  id: string;
  data: unknown;
  retryCount: number;
  retryLimit: number;
}
export function handleSanitizeDocumentImageJob(deps: SanitizeDependencies, logger: Logger) {
  return async (job: SanitizeQueueJob) => {
    const data = sanitizeDocumentImageJobSchema.parse(job.data);
    try {
      const result = await sanitizeDocumentImage(deps, {
        ...data,
        finalAttempt: job.retryCount >= job.retryLimit,
      });
      logger.info({ jobId: job.id, ...result }, 'Đã làm sạch ảnh chứng từ');
      return result;
    } catch (error) {
      logger.warn(
        {
          jobId: job.id,
          retryCount: job.retryCount,
          finalAttempt: job.retryCount >= job.retryLimit,
          reason: 'sanitize_failed',
        },
        'Không làm sạch được ảnh chứng từ',
      );
      throw error;
    }
  };
}
