import { z } from 'zod';

// Số tiền USD đúng đến cent: so sau khi nhân 100 để tránh sai số dấu phẩy động (1.1 * 100 = 110.00000000000001).
const isWholeCents = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

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
