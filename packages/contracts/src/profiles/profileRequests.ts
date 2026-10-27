import { z } from 'zod';
import { consentConfirmationSchema } from './consentConfirmationSchema.js';

// Giới hạn năm hiện tại do use case kiểm tra bằng đồng hồ Việt Nam tại thời điểm request.
export const createHealthProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(1).max(60),
    birthYear: z.number().int().min(1900).optional(),
    linkedAccountId: z.uuid().optional(),
    consent: consentConfirmationSchema.optional(),
  })
  .meta({ id: 'CreateHealthProfileRequest' });
export type CreateHealthProfileRequest = z.infer<typeof createHealthProfileRequestSchema>;

export const confirmConsentRequestSchema = z
  .object({ confirmedBy: z.enum(['self', 'guardian']) })
  .meta({ id: 'ConfirmConsentRequest' });
export type ConfirmConsentRequest = z.infer<typeof confirmConsentRequestSchema>;

// SPEC-007: không trim — server so chính xác (sau NFC) với tên hồ sơ.
export const deleteHealthProfileRequestSchema = z
  .object({ confirmName: z.string().min(1).max(60) })
  .meta({ id: 'DeleteHealthProfileRequest' });
export type DeleteHealthProfileRequest = z.infer<typeof deleteHealthProfileRequestSchema>;
