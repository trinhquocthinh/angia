import { EXTRACT_DOCUMENT_QUEUE, ensureExtractDocumentQueues } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { handleExtractDocumentJob } from './handleExtractDocumentJob.js';

// concurrency = 1: giải mã HEIC ngốn ~340 MB RSS (spike E1-S1-T2), worker giới hạn 512 MB.
// Trả outcome để pg-boss lưu vào `output` của job — `yarn ops:ocr-latency` (NFR-3) tách chứng từ có bản trích xuất.
export async function registerExtractDocumentJob(
  boss: PgBoss,
  handler: ReturnType<typeof handleExtractDocumentJob>,
): Promise<void> {
  await ensureExtractDocumentQueues(boss);
  await boss.work(
    EXTRACT_DOCUMENT_QUEUE,
    { batchSize: 1, localConcurrency: 1, includeMetadata: true },
    async ([job]) => (job ? handler(job) : undefined),
  );
}
