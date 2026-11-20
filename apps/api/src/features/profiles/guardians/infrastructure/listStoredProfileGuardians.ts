import { and, asc, eq, sql } from 'drizzle-orm';
import { accounts, healthProfiles, profileGuardians } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { GuardianActor, ListProfileGuardiansResult } from '../application/ports.js';

export async function listStoredProfileGuardians(
  tx: FamilyScopedTx,
  actor: GuardianActor & { familyId: string },
  profileId: string,
): Promise<ListProfileGuardiansResult> {
  // LEFT JOIN giữ dòng hồ sơ không có giám hộ để phân biệt với hồ sơ ngoài nhà.
  const rows = await tx
    .select({ accountId: accounts.id, displayName: accounts.displayName })
    .from(healthProfiles)
    .leftJoin(
      profileGuardians,
      and(
        eq(profileGuardians.healthProfileId, healthProfiles.id),
        eq(profileGuardians.familyId, actor.familyId),
        eq(profileGuardians.familyId, healthProfiles.familyId),
        sql`COALESCE(extract(year FROM clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int - ${healthProfiles.birthYear} < 18, false)`,
        sql`NOT EXISTS (SELECT 1 FROM accounts linked WHERE linked.health_profile_id = ${healthProfiles.id} AND linked.family_id = ${healthProfiles.familyId})`,
      ),
    )
    .leftJoin(
      accounts,
      and(eq(accounts.id, profileGuardians.accountId), eq(accounts.familyId, profileGuardians.familyId)),
    )
    .where(and(eq(healthProfiles.id, profileId), eq(healthProfiles.familyId, actor.familyId)))
    .orderBy(asc(profileGuardians.createdAt), asc(profileGuardians.accountId));
  if (rows.length === 0) return { ok: false, code: 'ERR_NOT_FOUND' };
  return {
    ok: true,
    guardians: rows.flatMap((row) =>
      row.accountId === null || row.displayName === null
        ? []
        : [
            {
              accountId: row.accountId,
              displayName: row.displayName,
              isMe: row.accountId === actor.accountId,
            },
          ],
    ),
  };
}
