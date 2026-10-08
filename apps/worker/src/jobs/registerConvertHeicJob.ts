import { CONVERT_HEIC_QUEUE, CONVERT_HEIC_QUEUE_OPTIONS } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { handleConvertHeicJob } from './handleConvertHeicJob.js';
export async function registerConvertHeicJob(
  boss: PgBoss,
  handler: ReturnType<typeof handleConvertHeicJob>,
): Promise<void> {
  await boss.createQueue(CONVERT_HEIC_QUEUE, CONVERT_HEIC_QUEUE_OPTIONS);
  await boss.work(
    CONVERT_HEIC_QUEUE,
    { batchSize: 1, localConcurrency: 1, includeMetadata: true },
    async ([job]) => {
      if (job) await handler(job);
    },
  );
}
