import { z } from 'zod';
import { isWholeCents } from './isWholeCents.js';

// SPEC-013: trần áp dụng toàn hệ thống cho tháng ngân sách hiện tại (Asia/Ho_Chi_Minh, BR-018).
export const updateAiBudgetRequestSchema = z
  .object({ monthlyCapUsd: z.number().min(0).max(100).refine(isWholeCents) })
  .meta({ id: 'UpdateExtractionCapRequest' });

export type UpdateAiBudgetRequest = z.infer<typeof updateAiBudgetRequestSchema>;

// spentThisMonthUsd gồm cả phần đang giữ chỗ cho lời gọi AI chưa quyết toán.
export const aiBudgetSchema = z
  .object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    monthlyCapUsd: z.number(),
    spentThisMonthUsd: z.number(),
  })
  .meta({ id: 'SpendResponse' });

export type AiBudget = z.infer<typeof aiBudgetSchema>;
