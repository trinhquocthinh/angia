import { and, eq } from 'drizzle-orm';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ConsentStatus } from '../domain/HealthProfile.js';

// Trạng thái đồng thuận của hồ sơ trong gia đình; null = không có hồ sơ (hoặc thuộc gia đình khác).
export async function findProfileConsent(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
): Promise<ConsentStatus | null> {
  const rows = await tx
    .select({ consentStatus: healthProfiles.consentStatus })
    .from(healthProfiles)
    .where(and(eq(healthProfiles.id, profileId), eq(healthProfiles.familyId, familyId)));
  return rows[0]?.consentStatus ?? null;
}
