import type pg from 'pg';

// Caller giữ withFamilyScope. Tuổi theo năm Việt Nam; giám hộ là nguồn duy nhất cho trẻ chưa liên kết.
export async function listEffectiveReminderAssignments(
  client: pg.PoolClient,
  familyId: string,
  profileId: string | null = null,
) {
  const { rows } = await client.query<{ profileId: string; accountId: string }>(
    `
    WITH p AS (
      SELECT id, COALESCE(extract(year FROM clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int - birth_year < 18, false)
        AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.health_profile_id=health_profiles.id) AS guarded
      FROM health_profiles WHERE family_id=$1 AND ($2::uuid IS NULL OR id=$2)
    )
    SELECT g.health_profile_id AS "profileId", g.account_id AS "accountId"
      FROM profile_guardians g JOIN p ON p.id=g.health_profile_id WHERE g.family_id=$1 AND p.guarded
    UNION ALL
    SELECT r.health_profile_id AS "profileId", r.account_id AS "accountId"
      FROM reminder_recipients r JOIN p ON p.id=r.health_profile_id WHERE r.family_id=$1 AND NOT p.guarded
  `,
    [familyId, profileId],
  );
  return rows;
}
