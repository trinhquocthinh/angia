import { z } from 'zod';

const count = z.number().int().nonnegative();
const limit = z.number().int().positive();

// SPEC-030: mức đã dùng / trần tài nguyên của gia đình phiên; `resetsAt` = 00:00 giờ Việt Nam kế tiếp.
export const familyUsageSchema = z
  .object({
    storage: z.object({ usedBytes: count, limitBytes: limit }),
    dailyUploads: z.object({ used: count, limit, resetsAt: z.string() }),
    pendingJobs: z.object({ used: count, limit }),
    // Gia đình chỉ thấy phần trăm lượt tháng và nguyên nhân chờ, không nhận dữ liệu tiền.
    aiOcr: z.object({
      month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
      usedPercent: z.number().int().min(0).max(100),
      anyUsed: z.boolean(),
      exhausted: z.boolean(),
      reason: z.enum(['scan_quota_exhausted', 'budget_exhausted', 'billing_unavailable']).optional(),
    }),
  })
  .meta({ id: 'FamilyUsage' });

export type FamilyUsage = z.infer<typeof familyUsageSchema>;
