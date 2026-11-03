import { and, eq } from 'drizzle-orm';
import { listFamilyAccounts } from '@src/features/reminders/infrastructure/listFamilyAccounts.js';
import { reminderRecipients } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { toDoseAudience } from '../application/toDoseAudience.js';

export async function loadDoseAudience(tx: FamilyScopedTx, familyId: string, profileId: string) {
  const assigned = await tx
    .select({ accountId: reminderRecipients.accountId })
    .from(reminderRecipients)
    .where(and(eq(reminderRecipients.healthProfileId, profileId), eq(reminderRecipients.familyId, familyId)));
  return toDoseAudience(
    profileId,
    await listFamilyAccounts(tx, familyId),
    assigned.map((r) => r.accountId),
  );
}
