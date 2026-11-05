import { and, eq, sql } from 'drizzle-orm';
import { healthProfiles, reminders } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { LockedReminder } from '../application/ports.js';
import { listDoseConfirmations } from './listDoseConfirmations.js';
import { loadDoseAudience } from './loadDoseAudience.js';

// Thứ tự hồ sơ → lời nhắc khớp cascade từ hồ sơ để tránh deadlock. FOR SHARE hồ sơ tuần tự với rút
// đồng thuận; khóa lời nhắc tuần tự các lần bấm, bản xác nhận đọc sau khóa nên thấy bản của người ghi trước.
export async function lockReminderForConfirmation(
  tx: FamilyScopedTx,
  familyId: string,
  reminderId: string,
): Promise<LockedReminder | null> {
  const ofReminder = and(eq(reminders.id, reminderId), eq(reminders.familyId, familyId));
  const [target] = await tx
    .select({ profileId: reminders.healthProfileId })
    .from(reminders)
    .where(ofReminder);
  if (!target) return null;
  const [profile] = await tx
    .select({ consentStatus: healthProfiles.consentStatus })
    .from(healthProfiles)
    .where(eq(healthProfiles.id, target.profileId))
    .for('share');
  const [reminder] = await tx
    .select({ date: sql<string>`${reminders.date}::text`, slot: reminders.slot })
    .from(reminders)
    .where(ofReminder)
    .for('no key update');
  if (!profile || !reminder) return null;
  const confirmations = await listDoseConfirmations(tx, target.profileId, reminder.date);
  return {
    id: reminderId,
    profileId: target.profileId,
    ...reminder,
    consentStatus: profile.consentStatus,
    audience: await loadDoseAudience(tx, familyId, target.profileId),
    confirmation: confirmations.find((c) => c.slot === reminder.slot) ?? null,
  };
}
