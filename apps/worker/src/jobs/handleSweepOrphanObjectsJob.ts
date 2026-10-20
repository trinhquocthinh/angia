import type { Logger } from 'pino';
import type { SweepDependencies, SweepPolicy } from '@src/features/orphanObjects/application/ports.js';
import { sweepOrphanObjects } from '@src/features/orphanObjects/application/sweepOrphanObjects.js';

// SPEC-032: log theo gia đình chỉ có số đếm và familyId (uuid nội bộ); không ghi khóa object hay tên tệp.
export function handleSweepOrphanObjectsJob(deps: SweepDependencies, policy: SweepPolicy, logger: Logger) {
  return async (job: { id: string }) => {
    const result = await sweepOrphanObjects(deps, policy);
    for (const report of result.families) {
      if (report.outcome !== 'swept')
        logger.warn(
          { jobId: job.id, dryRun: result.dryRun, ...report },
          'Bỏ qua dọn object mồ côi của gia đình',
        );
      else if (report.removed + report.skipped + report.failed > 0)
        logger.info({ jobId: job.id, dryRun: result.dryRun, ...report }, 'Đã dọn object mồ côi của gia đình');
    }
    const summary = { jobId: job.id, ...result.totals, capped: result.capped, dryRun: result.dryRun };
    if (result.capped) logger.error(summary, 'Dọn object mồ côi chạm trần xóa, dừng lần quét');
    else logger.info(summary, 'Đã quét object S3 mồ côi');
    return result;
  };
}
