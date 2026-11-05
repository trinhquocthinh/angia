import { revisitReminders } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// SPEC-043/044: chỉ sinh mốc rơi vào hôm nay, kể cả đã qua 06:00; job gửi quyết định cửa sổ gửi.
export async function ensureRevisitReminder(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  date: string,
  today: string,
): Promise<void> {
  const days = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000;
  if (days !== 0 && days !== 2) return;
  await tx
    .insert(revisitReminders)
    .values({
      familyId,
      healthProfileId: profileId,
      revisitDate: date,
      offsetKind: days === 0 ? 'same_day' : 'two_days_before',
      sendDate: today,
      scheduledAt: new Date(`${today}T06:00:00+07:00`),
    })
    .onConflictDoNothing({
      target: [revisitReminders.healthProfileId, revisitReminders.revisitDate, revisitReminders.offsetKind],
    });
}
