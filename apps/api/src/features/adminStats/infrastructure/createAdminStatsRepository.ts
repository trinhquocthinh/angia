import { sql } from 'drizzle-orm';
import { adminStatsWeekSchema } from '@angia/contracts';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { AdminStatsRepository } from '../application/ports.js';

export function createAdminStatsRepository(db: Database): AdminStatsRepository {
  return {
    async weekly(weeks) {
      const result = await db.execute(sql`
        SELECT week_start::text, families, accounts,
          families_with_dose_confirmation, families_active_streak_4w
        FROM public.admin_weekly_stats(${weeks}::integer)
      `);
      return result.rows.map((r) =>
        adminStatsWeekSchema.parse({
          weekStart: r.week_start,
          families: r.families,
          accounts: r.accounts,
          familiesWithDoseConfirmation: r.families_with_dose_confirmation,
          familiesActiveStreak4w: r.families_active_streak_4w,
        }),
      );
    },
  };
}
