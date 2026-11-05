import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { seedDeliveryFamily } from './seedDeliveryFamily.test-helper.js';

export const REVISIT_DATE = '2026-11-20';
export const REVISIT_NOW = new Date('2026-11-17T23:00:00Z');

export async function seedRevisitFamily(owner: pg.Client) {
  const f = await seedDeliveryFamily(owner);
  const addAccount = async (role: string, linked = false) => {
    const id = randomUUID();
    await owner.query(
      `INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role,health_profile_id)
      VALUES ($1,$2,'Tài khoản',$3,$4,$5)`,
      [id, `sub-${id}`, f.familyId, role, linked ? f.profileId : null],
    );
    return id;
  };
  const addPrescription = async (date: string | null = REVISIT_DATE) => {
    await owner.query(
      `INSERT INTO prescriptions(id,family_id,health_profile_id,issued_date,revisit_date,manual_without_source)
      VALUES ($1,$2,$3,'2026-11-01',$4,true)`,
      [randomUUID(), f.familyId, f.profileId, date],
    );
  };
  const addRevisit = async (scheduledAt = REVISIT_NOW) => {
    const id = randomUUID();
    await owner.query(
      `INSERT INTO revisit_reminders(id,family_id,health_profile_id,revisit_date,offset_kind,send_date,scheduled_at)
      VALUES ($1,$2,$3,'2026-11-20','two_days_before','2026-11-18',$4)`,
      [id, f.familyId, f.profileId, scheduledAt],
    );
    return id;
  };
  const rows = async (id?: string) =>
    (
      await owner.query(
        `SELECT * FROM reminder_deliveries
    WHERE family_id=$1 AND ($2::uuid IS NULL OR revisit_reminder_id=$2) ORDER BY id`,
        [f.familyId, id ?? null],
      )
    ).rows;
  return { ...f, addAccount, addPrescription, addRevisit, rows };
}
