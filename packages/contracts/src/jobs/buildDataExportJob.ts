import { z } from 'zod';

// SPEC-072: API và worker cùng dùng tên queue, chính sách retry và payload này.
export const BUILD_DATA_EXPORT_QUEUE = 'build-data-export';
export const BUILD_DATA_EXPORT_QUEUE_OPTIONS = {
  retryLimit: 5,
  retryDelay: 60,
  retryBackoff: true,
} as const;
export const buildDataExportJobSchema = z.object({ exportId: z.uuid() });
export type BuildDataExportJob = z.infer<typeof buildDataExportJobSchema>;
