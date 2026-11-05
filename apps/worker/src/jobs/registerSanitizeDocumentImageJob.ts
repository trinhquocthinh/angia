import { SANITIZE_DOCUMENT_IMAGE_QUEUE, SANITIZE_DOCUMENT_IMAGE_QUEUE_OPTIONS } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { handleSanitizeDocumentImageJob } from './handleSanitizeDocumentImageJob.js';

export async function registerSanitizeDocumentImageJob(
  boss: PgBoss,
  handler: ReturnType<typeof handleSanitizeDocumentImageJob>,
): Promise<void> {
  await boss.createQueue(SANITIZE_DOCUMENT_IMAGE_QUEUE, SANITIZE_DOCUMENT_IMAGE_QUEUE_OPTIONS);
  await boss.work(
    SANITIZE_DOCUMENT_IMAGE_QUEUE,
    { batchSize: 1, localConcurrency: 1, includeMetadata: true },
    async ([job]) => {
      if (job) await handler(job);
    },
  );
}
