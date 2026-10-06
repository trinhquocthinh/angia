import { extractDocumentJobSchema } from '@angia/contracts';
import type { Logger } from 'pino';
import type { ExtractionDependencies } from '@src/features/extraction/application/ports.js';
import {
  extractDocument,
  type ExtractionOutcome,
} from '@src/features/extraction/application/extractDocument.js';

interface ExtractDocumentJob {
  id: string;
  data: unknown;
  retryCount: number;
  retryLimit: number;
}

// Ánh xạ job pg-boss → use case. Lần thử cuối (retryCount = retryLimit) chuyển lỗi gọi AI thành manual_entry.
// Log chỉ gồm ID chứng từ và kết quả — không có tên hồ sơ hay nội dung trích xuất.
export function handleExtractDocumentJob(deps: ExtractionDependencies, logger: Logger) {
  return async (job: ExtractDocumentJob): Promise<ExtractionOutcome> => {
    const { documentId, familyId } = extractDocumentJobSchema.parse(job.data);
    const finalAttempt = job.retryCount >= job.retryLimit;
    try {
      const outcome = await extractDocument(deps, { documentId, familyId, finalAttempt });
      logger.info({ jobId: job.id, documentId, ...outcome }, 'Đã xử lý job extract-document');
      return outcome;
    } catch (error) {
      logger.warn(
        { jobId: job.id, documentId, retryCount: job.retryCount, reason: (error as Error).message },
        'Gọi AI lỗi, pg-boss sẽ thử lại',
      );
      throw error;
    }
  };
}
