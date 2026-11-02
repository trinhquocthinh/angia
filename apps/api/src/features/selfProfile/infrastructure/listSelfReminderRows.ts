import { and, asc, eq, sql } from 'drizzle-orm';
import { reminders } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { StoredSelfReminder } from '../application/ports.js';

// `date` ép sang text trong SQL để không lệch ngày theo múi giờ của tiến trình.
export async function listSelfReminderRows(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  date: string,
): Promise<StoredSelfReminder[]> {
  const rows = await tx
    .select({
      id: reminders.id,
      date: sql<string>`${reminders.date}::text`,
      slot: reminders.slot,
      scheduledAt: reminders.scheduledAt,
      medications: reminders.medications,
    })
    .from(reminders)
    .where(
      and(
        eq(reminders.familyId, familyId),
        eq(reminders.healthProfileId, profileId),
        eq(reminders.date, date),
      ),
    )
    .orderBy(asc(reminders.scheduledAt));
  return rows.map((row) => ({
    ...row,
    scheduledAt: row.scheduledAt.toISOString(),
    medications: row.medications as StoredSelfReminder['medications'],
  }));
}
