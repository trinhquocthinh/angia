import { z } from 'zod';

// Giới hạn năm hiện tại do use case kiểm tra bằng đồng hồ Việt Nam tại thời điểm request.
export const createHealthProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(1).max(60),
    birthYear: z.number().int().min(1900).optional(),
    linkedAccountId: z.uuid().optional(),
  })
  .meta({ id: 'CreateHealthProfileRequest' });
export type CreateHealthProfileRequest = z.infer<typeof createHealthProfileRequestSchema>;

export const confirmConsentRequestSchema = z
  .object({ confirmedBy: z.enum(['self', 'guardian']) })
  .meta({ id: 'ConfirmConsentRequest' });
export type ConfirmConsentRequest = z.infer<typeof confirmConsentRequestSchema>;
