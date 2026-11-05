import { randomUUID } from 'node:crypto';
import type pg from 'pg';

export async function seedRevisitReminder(
  owner: pg.Client,
  familyId: string,
  profileId: string,
): Promise<string> {
  const id = randomUUID();
  await owner.query(
    `INSERT INTO revisit_reminders
    (id,family_id,health_profile_id,revisit_date,offset_kind,send_date,scheduled_at)
    VALUES ($1,$2,$3,'2026-11-20','same_day','2026-11-20','2026-11-20T06:00:00+07:00')`,
    [id, familyId, profileId],
  );
  return id;
}
