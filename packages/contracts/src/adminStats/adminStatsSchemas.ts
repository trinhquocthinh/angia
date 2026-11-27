import { z } from 'zod';

export const adminStatsQuerySchema = z
  .object({
    weeks: z.coerce.number().int().min(1).max(52).default(12),
  })
  .meta({ id: 'AdminStatsQuery' });
export const adminStatsWeekSchema = z
  .strictObject({
    weekStart: z.iso.date(),
    families: z.number().int().nonnegative(),
    accounts: z.number().int().nonnegative(),
    familiesWithDoseConfirmation: z.number().int().nonnegative(),
    familiesActiveStreak4w: z.number().int().nonnegative(),
  })
  .meta({ id: 'AdminStatsWeek' });
export const adminStatsResponseSchema = z
  .strictObject({ weeks: z.array(adminStatsWeekSchema) })
  .meta({ id: 'AdminStatsResponse' });
export type AdminStatsWeek = z.infer<typeof adminStatsWeekSchema>;
export type AdminStatsResponse = z.infer<typeof adminStatsResponseSchema>;
