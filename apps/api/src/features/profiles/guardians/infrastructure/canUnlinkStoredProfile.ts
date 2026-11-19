import { and, eq, sql } from 'drizzle-orm';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Hồ sơ đang liên kết không có giám hộ; không gỡ liên kết trẻ trước khi có quy trình chọn giám hộ.
export async function canUnlinkStoredProfile(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
): Promise<boolean> {
  const [profile] = await tx
    .select({
      allowed: sql<boolean>`NOT COALESCE(extract(year FROM clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int - ${healthProfiles.birthYear} < 18, false)`,
    })
    .from(healthProfiles)
    .where(and(eq(healthProfiles.familyId, familyId), eq(healthProfiles.id, profileId)))
    .for('update');
  return profile?.allowed ?? false;
}
