import { z } from 'zod';
import { isWholeCents } from './isWholeCents.js';

// SPEC-031: trần chi phí OCR riêng của gia đình; null = dùng AI_DEFAULT_FAMILY_MONTHLY_CAP_USD.
export const updateFamilyExtractionCapRequestSchema = z
  .object({ capUsd: z.number().min(0).max(100).refine(isWholeCents).nullable() })
  .meta({ id: 'UpdateFamilyExtractionCapRequest' });

export type UpdateFamilyExtractionCapRequest = z.infer<typeof updateFamilyExtractionCapRequestSchema>;

// Chỉ Quản trị hệ thống xem (USD); spentUsd gồm cả phần đang giữ chỗ của tháng giờ Việt Nam.
export const familyExtractionCapSchema = z
  .object({
    familyId: z.uuid(),
    familyName: z.string(),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    capUsd: z.number(),
    capIsDefault: z.boolean(),
    spentUsd: z.number(),
  })
  .meta({ id: 'FamilyExtractionCap' });

export type FamilyExtractionCap = z.infer<typeof familyExtractionCapSchema>;
