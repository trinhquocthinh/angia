import { z } from 'zod';

const count = z.number().int().nonnegative();
const limit = z.number().int().positive();

// SPEC-030: mức đã dùng / trần tài nguyên của gia đình phiên; `resetsAt` = 00:00 giờ Việt Nam kế tiếp.
export const familyUsageSchema = z
  .object({
    storage: z.object({ usedBytes: count, limitBytes: limit }),
    dailyUploads: z.object({ used: count, limit, resetsAt: z.string() }),
    pendingJobs: z.object({ used: count, limit }),
  })
  .meta({ id: 'FamilyUsage' });

export type FamilyUsage = z.infer<typeof familyUsageSchema>;
