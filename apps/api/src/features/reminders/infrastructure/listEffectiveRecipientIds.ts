import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Chỉ dùng trong withFamilyScope. Hồ sơ trẻ lấy giám hộ hiện tại, không fallback sang chỉ định cũ.
export async function listEffectiveRecipientIds(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
): Promise<string[]> {
  const { rows } = await tx.execute<{ accountId: string }>(sql`
    WITH p AS (
      SELECT id, COALESCE(extract(year FROM clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int - birth_year < 18, false)
        AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.health_profile_id = health_profiles.id) AS guarded
      FROM health_profiles WHERE id=${profileId} AND family_id=${familyId}
    )
    SELECT g.account_id AS "accountId" FROM profile_guardians g JOIN p ON p.id=g.health_profile_id
      WHERE g.family_id=${familyId} AND p.guarded
    UNION ALL
    SELECT r.account_id AS "accountId" FROM reminder_recipients r JOIN p ON p.id=r.health_profile_id
      WHERE r.family_id=${familyId} AND NOT p.guarded
  `);
  return rows.map((r) => r.accountId);
}
