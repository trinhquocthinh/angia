import { z } from 'zod';
import { privacyRectangleSchema } from './privacySchemas.js';

// SPEC-083: chỉ toạ độ khung gợi ý (đơn vị 1.000.000 trên ảnh đã xoay, cùng hệ PrivacyEdits); không có chữ OCR.
export const redactionSuggestionsResponseSchema = z
  .object({ masks: z.array(privacyRectangleSchema).max(64) })
  .strict()
  .meta({ id: 'RedactionSuggestions' });

export type RedactionSuggestions = z.infer<typeof redactionSuggestionsResponseSchema>;
