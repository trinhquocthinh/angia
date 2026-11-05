import { ExtractionBusyError } from '@src/features/extraction/application/ExtractionBusyError.js';
import { extractDocumentJobSchema } from '@angia/contracts';
import type { Logger } from 'pino';
import { AiRoutingError } from '@src/features/aiRouting/application/AiRoutingError.js';
import type { ExtractionAttemptProvider } from '@src/features/aiRouting/application/ports.js';
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
export function handleExtractDocumentJob(
  deps: ExtractionDependencies,
  logger: Logger,
  attempts?: ExtractionAttemptProvider,
) {
  return async (job: ExtractDocumentJob): Promise<ExtractionOutcome> => {
    const { documentId, familyId } = extractDocumentJobSchema.parse(job.data);
    const finalAttempt = job.retryCount >= job.retryLimit;
    try {
      const attempt = await attempts?.prepare();
      const active = attempt?.dependencies ?? deps;
      const work = (repository: typeof active.repository) =>
        extractDocument({ ...active, repository }, { documentId, familyId, finalAttempt });
      const outcome: ExtractionOutcome = active.repository.runExclusive
        ? ((await active.repository.runExclusive(familyId, documentId, work)) ?? failBusy())
        : await work(active.repository);
      logger.info(
        { jobId: job.id, documentId, snapshot: attempt?.snapshot, ...outcome },
        'Đã xử lý job extract-document',
      );
      return outcome;
    } catch (error) {
      logger.warn(
        {
          jobId: job.id,
          documentId,
          retryCount: job.retryCount,
          reason: error instanceof AiRoutingError ? error.code : 'extraction_failed',
        },
        'Xử lý OCR lỗi, pg-boss xử lý retry/dead-letter theo cấu hình hàng đợi',
      );
      throw error;
    }
  };
}

function failBusy(): never {
  throw new ExtractionBusyError();
}
