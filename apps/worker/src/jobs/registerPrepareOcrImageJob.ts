import { PREPARE_OCR_IMAGE_QUEUE, PREPARE_OCR_IMAGE_QUEUE_OPTIONS } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { handlePrepareOcrImageJob } from './handlePrepareOcrImageJob.js';
export async function registerPrepareOcrImageJob(
  boss: PgBoss,
  handler: ReturnType<typeof handlePrepareOcrImageJob>,
): Promise<void> {
  await boss.createQueue(PREPARE_OCR_IMAGE_QUEUE, PREPARE_OCR_IMAGE_QUEUE_OPTIONS);
  await boss.work(
    PREPARE_OCR_IMAGE_QUEUE,
    { batchSize: 1, localConcurrency: 1, includeMetadata: true },
    async ([job]) => {
      if (job) await handler(job);
    },
  );
}
