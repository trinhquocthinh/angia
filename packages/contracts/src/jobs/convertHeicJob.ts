import { z } from 'zod';

// Chuẩn bị WebP cho mọi định dạng ảnh nhận tại SPEC-008, chưa gọi AI.
export const CONVERT_HEIC_QUEUE = 'convert-heic';
export const CONVERT_HEIC_QUEUE_OPTIONS = {
  retryLimit: 2,
  retryDelay: 30,
  retryBackoff: true,
  expireInSeconds: 300,
} as const;
export const convertHeicJobSchema = z.object({ documentId: z.uuid(), familyId: z.uuid() });
export type ConvertHeicJob = z.infer<typeof convertHeicJobSchema>;
