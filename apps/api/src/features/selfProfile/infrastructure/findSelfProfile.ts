import { and, eq } from 'drizzle-orm';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { SelfProfileRow } from '../application/ports.js';

export async function findSelfProfile(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
): Promise<SelfProfileRow | null> {
  const [row] = await tx
    .select({
      id: healthProfiles.id,
      displayName: healthProfiles.displayName,
      birthYear: healthProfiles.birthYear,
      consentStatus: healthProfiles.consentStatus,
      vitalsEnabled: healthProfiles.vitalsEnabled,
    })
    .from(healthProfiles)
    .where(and(eq(healthProfiles.id, profileId), eq(healthProfiles.familyId, familyId)));
  return row ?? null;
}
