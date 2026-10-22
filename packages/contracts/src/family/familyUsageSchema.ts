import { z } from 'zod';

const count = z.number().int().nonnegative();
const limit = z.number().int().positive();

// SPEC-030: mức đã dùng / trần tài nguyên của gia đình phiên; `resetsAt` = 00:00 giờ Việt Nam kế tiếp.
export const familyUsageSchema = z
  .object({
    storage: z.object({ usedBytes: count, limitBytes: limit }),
    dailyUploads: z.object({ used: count, limit, resetsAt: z.string() }),
    pendingJobs: z.object({ used: count, limit }),
    // SPEC-031: gia đình chỉ thấy phần trăm trần AI tháng (giờ VN); exhausted = lời gọi kế tiếp sẽ vượt trần;
    // anyUsed = đã có chi tiêu > 0 (phần trăm làm tròn xuống 0 thì giao diện hiện "dưới 1%").
    aiOcr: z.object({
      month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
      usedPercent: z.number().int().min(0).max(100),
      anyUsed: z.boolean(),
      exhausted: z.boolean(),
    }),
  })
  .meta({ id: 'FamilyUsage' });

export type FamilyUsage = z.infer<typeof familyUsageSchema>;
