import { BUILD_DATA_EXPORT_QUEUE, BUILD_DATA_EXPORT_QUEUE_OPTIONS } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type { DataExportDependencies } from '@src/features/dataExport/application/ports.js';
import { handleBuildDataExportJob } from './handleBuildDataExportJob.js';

export async function registerBuildDataExportJob(
  boss: PgBoss,
  deps: DataExportDependencies,
  logger: Pick<Logger, 'info' | 'error'>,
): Promise<void> {
  await boss.createQueue(BUILD_DATA_EXPORT_QUEUE, BUILD_DATA_EXPORT_QUEUE_OPTIONS);
  const handle = handleBuildDataExportJob(deps, logger);
  await boss.work(BUILD_DATA_EXPORT_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (job) await handle(job);
  });
}
