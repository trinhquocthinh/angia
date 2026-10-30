import type pg from 'pg';

// Cùng thứ tự khóa với PUT/DELETE: SHARE consent → khóa thuốc → đọc lại ngày hẹn.
// Chỉ đọc/ghi khi caller đã ở trong withFamilyScope.
export async function generateRevisitReminders(
  client: pg.PoolClient,
  familyId: string,
  date: string,
  newId: () => string,
): Promise<{ created: number; existing: number }> {
  const profiles = await client.query<{ id: string }>(
    `SELECT id FROM health_profiles WHERE family_id=$1 AND consent_status='confirmed' ORDER BY id FOR SHARE`,
    [familyId],
  );
  let created = 0;
  let existing = 0;
  for (const profile of profiles.rows) {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      `angia:medications:${familyId.toLowerCase()}:${profile.id.toLowerCase()}`,
    ]);
    const dates = await client.query<{ date: string }>(
      `SELECT DISTINCT revisit_date::text AS date FROM prescriptions
       WHERE family_id=$1 AND health_profile_id=$2 AND revisit_date IN ($3::date, $3::date + 2)`,
      [familyId, profile.id, date],
    );
    for (const revisit of dates.rows) {
      const result = await client.query(
        `INSERT INTO revisit_reminders
          (id,family_id,health_profile_id,revisit_date,offset_kind,send_date,scheduled_at)
         VALUES ($1,$2,$3,$4,CASE WHEN $4::date=$5::date THEN 'same_day' ELSE 'two_days_before' END,
           $5, ($5::date + time '06:00') AT TIME ZONE 'Asia/Ho_Chi_Minh')
         ON CONFLICT (health_profile_id,revisit_date,offset_kind) DO NOTHING`,
        [newId(), familyId, profile.id, revisit.date, date],
      );
      created += result.rowCount ?? 0;
      existing += 1 - (result.rowCount ?? 0);
    }
  }
  return { created, existing };
}
