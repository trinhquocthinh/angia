import type pg from 'pg';
import { generateRevisitReminders } from './generateRevisitReminders.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ReminderFamilyStore, ReminderRepository } from '../application/ports.js';
import type { CourseSnapshot, DailyReminder, DailySlot, ProfileSnapshot } from '../domain/DailyReminder.js';

type CourseRow = Omit<CourseSnapshot, 'quantityPerDose'> & {
  profileId: string;
  quantityPerDose: string | null;
};

function groupBy<T extends { profileId: string }>(rows: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) groups.set(row.profileId, [...(groups.get(row.profileId) ?? []), row]);
  return groups;
}

async function listProfiles(
  client: pg.PoolClient,
  familyId: string,
  date: string,
): Promise<ProfileSnapshot[]> {
  const profiles = await client.query<{ id: string; consentConfirmed: boolean }>(
    `SELECT id, consent_status = 'confirmed' AS "consentConfirmed" FROM health_profiles WHERE family_id = $1 ORDER BY id`,
    [familyId],
  );
  const slots = await client.query<{ profileId: string; slot: DailySlot; time: string }>(
    `SELECT health_profile_id AS "profileId", slot, to_char(time_of_day, 'HH24:MI') AS time
       FROM dose_slots WHERE family_id = $1`,
    [familyId],
  );
  const recipients = await client.query<{ profileId: string; accountId: string }>(
    `SELECT health_profile_id AS "profileId", account_id AS "accountId" FROM reminder_recipients WHERE family_id = $1`,
    [familyId],
  );
  // Ép kiểu text: pg trả date thành Date theo múi giờ tiến trình, dễ lệch ngày.
  const courses = await client.query<CourseRow>(
    `SELECT id, health_profile_id AS "profileId", name, strength, quantity_per_dose::text AS "quantityPerDose",
            dose_unit AS "doseUnit", slots, start_date::text AS "startDate", end_date::text AS "endDate"
       FROM medication_courses
      WHERE family_id = $1 AND start_date <= $2 AND (end_date IS NULL OR end_date >= $2)
      ORDER BY id`,
    [familyId, date],
  );
  const [slotsOf, recipientsOf, coursesOf] = [
    groupBy(slots.rows),
    groupBy(recipients.rows),
    groupBy(courses.rows),
  ];
  return profiles.rows.map((profile) => ({
    profileId: profile.id,
    consentConfirmed: profile.consentConfirmed,
    slotTimes: Object.fromEntries((slotsOf.get(profile.id) ?? []).map((s) => [s.slot, s.time])),
    courses: (coursesOf.get(profile.id) ?? []).map(({ profileId: _, ...course }) => course),
    assignedAccountIds: (recipientsOf.get(profile.id) ?? []).map((r) => r.accountId),
  }));
}

async function insertReminders(
  client: pg.PoolClient,
  familyId: string,
  reminders: DailyReminder[],
  newId: () => string,
): Promise<number> {
  const values: unknown[] = [];
  const tuples = reminders.map((reminder, index) => {
    const { profileId, date, slot, scheduledAt, medications } = reminder;
    values.push(newId(), familyId, profileId, date, slot, scheduledAt, JSON.stringify(medications));
    const at = index * 7;
    return `($${at + 1}, $${at + 2}, $${at + 3}, $${at + 4}, $${at + 5}, $${at + 6}, $${at + 7}::jsonb)`;
  });
  const result = await client.query(
    `INSERT INTO reminders (id, family_id, health_profile_id, date, slot, scheduled_at, medications)
     VALUES ${tuples.join(', ')}
     ON CONFLICT ON CONSTRAINT reminders_profile_date_slot_unique DO NOTHING`,
    values,
  );
  return result.rowCount ?? 0;
}

// Pool role app NOBYPASSRLS: families/accounts không áp RLS nên liệt kê được (lọc family_id tường minh);
// dữ liệu sức khỏe chỉ đọc/ghi trong withFamilyScope (Tech Spec §3).
export function createReminderRepository(pool: pg.Pool, newId: () => string): ReminderRepository {
  return {
    listFamilyIds: async () =>
      (await pool.query<{ id: string }>('SELECT id FROM families ORDER BY id')).rows.map((row) => row.id),
    withFamily: (familyId, work) =>
      withFamilyScope(pool, familyId, (client) => {
        const store: ReminderFamilyStore = {
          generateRevisitReminders: (date) => generateRevisitReminders(client, familyId, date, newId),
          listFamilyAccounts: async () =>
            (
              await client.query(
                `SELECT id, family_role AS role, health_profile_id AS "healthProfileId"
                   FROM accounts WHERE family_id = $1 AND family_role IS NOT NULL`,
                [familyId],
              )
            ).rows,
          listProfiles: (date) => listProfiles(client, familyId, date),
          insertReminders: (reminders) => insertReminders(client, familyId, reminders, newId),
        };
        return work(store);
      }),
  };
}
