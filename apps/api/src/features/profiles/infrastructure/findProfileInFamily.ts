import { and, eq } from 'drizzle-orm';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Bên gọi giữ transaction RLS và chọn khóa theo thao tác hiện hành.
export async function findProfileInFamily(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  lock?: 'share' | 'update',
) {
  const query = tx
    .select({ consentStatus: healthProfiles.consentStatus })
    .from(healthProfiles)
    .where(and(eq(healthProfiles.id, profileId), eq(healthProfiles.familyId, familyId)));

  return (await (lock ? query.for(lock) : query))[0] ?? null;
}
