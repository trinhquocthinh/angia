import { z } from 'zod';
import { labResultSchema } from './labResultSchema.js';

// SPEC-021: lọc theo tên chỉ số (so khớp đã chuẩn hóa); bỏ trống → mọi chỉ số.
export const labSeriesQuerySchema = z.object({
  testName: z.string().trim().min(1).max(200).optional(),
});

// Một nhóm chỉ số: tên nguyên văn của lần mới nhất; kết quả cũ nhất trước, giữ nguyên văn phiếu (BR-022).
export const labSeriesSchema = z
  .object({ testName: z.string(), results: z.array(labResultSchema) })
  .meta({ id: 'LabSeries' });

// Không phân trang (chủ dự án chốt 2026-10-13); nhóm có kết quả mới nhất trước.
export const labSeriesResponseSchema = z.array(labSeriesSchema).meta({ id: 'LabSeriesResponse' });
export type LabSeries = z.infer<typeof labSeriesSchema>;
