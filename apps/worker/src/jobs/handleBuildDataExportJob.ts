import { buildDataExportJobSchema } from '@angia/contracts';
import type { Logger } from 'pino';
import { buildDataExport } from '@src/features/dataExport/application/buildDataExport.js';
import type { DataExportDependencies } from '@src/features/dataExport/application/ports.js';

export function handleBuildDataExportJob(
  deps: DataExportDependencies,
  logger: Pick<Logger, 'info' | 'error'>,
) {
  return async (job: { data: unknown }) => {
    const parsed = buildDataExportJobSchema.safeParse(job.data);
    if (!parsed.success) {
      logger.error({ outcome: 'invalid_payload' }, 'Payload xuất dữ liệu không hợp lệ');
      return;
    }
    const { exportId } = parsed.data;
    try {
      const outcome = await buildDataExport(deps, exportId);
      logger.info({ outcome }, 'Đã xử lý xuất dữ liệu');
    } catch {
      logger.error({ outcome: 'retry' }, 'Xuất dữ liệu cần thử lại');
      // Không chuyển lỗi SQL/S3 gốc sang pg-boss: chi tiết lỗi có thể chứa dữ liệu riêng tư.
      throw new Error('build_data_export_failed');
    }
  };
}
