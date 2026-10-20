import type { Logger } from 'pino';
import type { SweepDependencies, SweepPolicy } from '@src/features/orphanObjects/application/ports.js';
import { sweepOrphanObjects } from '@src/features/orphanObjects/application/sweepOrphanObjects.js';

// SPEC-032: log theo gia đình chỉ có số đếm và familyId (uuid nội bộ); không ghi khóa object hay tên tệp.
export function handleSweepOrphanObjectsJob(deps: SweepDependencies, policy: SweepPolicy, logger: Logger) {
  return async (job: { id: string; signal?: AbortSignal }) => {
    const result = await sweepOrphanObjects(deps, policy, job.signal);
    for (const report of result.families) {
      if (report.outcome !== 'swept')
        logger.warn(
          { jobId: job.id, dryRun: result.dryRun, ...report },
          'Bỏ qua dọn object mồ côi của gia đình',
        );
      else if (report.removed + report.skipped + report.failed > 0)
        logger.info({ jobId: job.id, dryRun: result.dryRun, ...report }, 'Đã dọn object mồ côi của gia đình');
    }
    const { capped, aborted, dryRun, listError } = result;
    const summary = { jobId: job.id, ...result.totals, capped, aborted, dryRun, listError };
    if (capped || listError)
      logger.error(summary, 'Dọn object mồ côi dừng: chạm trần xóa hoặc không đọc được danh sách gia đình');
    else if (aborted) logger.warn(summary, 'Dọn object mồ côi bị hủy do job hết hạn');
    else logger.info(summary, 'Đã quét object S3 mồ côi');
    return result;
  };
}
