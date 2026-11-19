import { z } from 'zod';

// Tên nhà tối đa 60 ký tự như createHouseholdRequestSchema; so khớp thật nằm ở kho (đọc lại từ DB).
export const familyDeletionRequestSchema = z
  .object({ confirmFamilyName: z.string().trim().min(1).max(60) })
  .strict();
export const familyDeletionRevokeSchema = z.object({ requestId: z.uuid() }).strict();
export const familyDeletionResponseSchema = z.object({
  id: z.uuid(),
  status: z.literal('pending'),
  executeAt: z.iso.datetime(),
});
