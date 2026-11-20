import { listEffectiveRecipientIds } from '@src/features/reminders/infrastructure/listEffectiveRecipientIds.js';
import { listFamilyAccounts } from '@src/features/reminders/infrastructure/listFamilyAccounts.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { toDoseAudience } from '../application/toDoseAudience.js';

export async function loadDoseAudience(tx: FamilyScopedTx, familyId: string, profileId: string) {
  const assigned = await listEffectiveRecipientIds(tx, familyId, profileId);
  return toDoseAudience(profileId, await listFamilyAccounts(tx, familyId), assigned);
}
