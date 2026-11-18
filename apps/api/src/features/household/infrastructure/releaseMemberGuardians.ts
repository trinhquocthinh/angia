import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { healthProfiles, profileGuardians } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Khoá hồ sơ trước khi đếm để hai lệnh hạ/gỡ không cùng bỏ người giám hộ cuối.
export async function releaseMemberGuardians(tx: FamilyScopedTx, familyId: string, accountId: string) {
  const own = await tx
    .select({ id: profileGuardians.healthProfileId })
    .from(profileGuardians)
    .where(and(eq(profileGuardians.familyId, familyId), eq(profileGuardians.accountId, accountId)));
  if (own.length === 0) return { ok: true } as const;
  const profiles = await tx
    .select({
      id: healthProfiles.id,
      needsGuardian: sql<boolean>`COALESCE(extract(year FROM clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int - ${healthProfiles.birthYear} < 18, false)
      AND NOT EXISTS (SELECT 1 FROM accounts WHERE health_profile_id=${healthProfiles.id})`,
    })
    .from(healthProfiles)
    .where(
      inArray(
        healthProfiles.id,
        own.map((row) => row.id),
      ),
    )
    .orderBy(asc(healthProfiles.id))
    .for('update');
  for (const profile of profiles) {
    const guardians = await tx
      .select({ id: profileGuardians.accountId })
      .from(profileGuardians)
      .where(and(eq(profileGuardians.familyId, familyId), eq(profileGuardians.healthProfileId, profile.id)));
    if (profile.needsGuardian && guardians.every((row) => row.id === accountId))
      return { ok: false, code: 'ERR_LAST_GUARDIAN' } as const;
  }
  await tx
    .delete(profileGuardians)
    .where(and(eq(profileGuardians.familyId, familyId), eq(profileGuardians.accountId, accountId)));
  return { ok: true } as const;
}
