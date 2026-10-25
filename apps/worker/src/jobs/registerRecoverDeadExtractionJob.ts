import { EXTRACT_DOCUMENT_DEAD_LETTER_QUEUE } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { handleRecoverDeadExtractionJob } from './handleRecoverDeadExtractionJob.js';

// Queue dead-letter đã được ensureExtractDocumentQueues tạo; gọi sau registerExtractDocumentJob.
export async function registerRecoverDeadExtractionJob(
  boss: PgBoss,
  handler: ReturnType<typeof handleRecoverDeadExtractionJob>,
): Promise<void> {
  await boss.work(EXTRACT_DOCUMENT_DEAD_LETTER_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (job) await handler(job);
  });
}
