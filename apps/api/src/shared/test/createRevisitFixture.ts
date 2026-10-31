import { randomUUID } from 'node:crypto';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from './acceptConsentInvitation.js';
import type { ProfileTestApp } from './startProfileTestApp.js';

// Dữ liệu lịch hẹn độc lập với các đợt thuốc; chỉ seed qua owner trong test.
export async function createRevisitFixture(t: ProfileTestApp, confirmed = true) {
  const familyId = await t.family();
  const main = await t.session(familyId);
  const profile = (await (
    await t.call(main, 'POST', '/api/health-profiles', {
      displayName: 'Mẹ',
      birthYear: 1950,
    })
  ).json()) as HealthProfile;
  if (confirmed) await acceptConsentInvitation(t, main, profile.id);
  const base = `/api/health-profiles/${profile.id}`;
  const add = async (date: string | null, issuedDate = '2026-01-01', documentId?: string) => {
    const id = randomUUID();
    await t.owner.query(
      `INSERT INTO prescriptions
      (id, family_id, health_profile_id, issued_date, revisit_date, facility, manual_without_source, source_document_id)
      VALUES ($1,$2,$3,$4,$5,'Phòng khám A',$6,$7)`,
      [id, familyId, profile.id, issuedDate, date, !documentId, documentId ?? null],
    );
    return id;
  };
  const reminder = async (date: string, sent = false, offset = 'two_days_before') => {
    const id = randomUUID();
    await t.owner.query(
      `INSERT INTO revisit_reminders
      (id, family_id, health_profile_id, revisit_date, offset_kind, send_date, scheduled_at, sent_at)
      VALUES ($1,$2,$3,$4,$5,$4::date - CASE WHEN $5 = 'same_day' THEN 0 ELSE 2 END,
        ($4::date - CASE WHEN $5 = 'same_day' THEN 0 ELSE 2 END) + time '06:00' AT TIME ZONE 'Asia/Ho_Chi_Minh',
        CASE WHEN $6 THEN now() ELSE NULL END)`,
      [id, familyId, profile.id, date, offset, sent],
    );
    await t.owner.query(
      `INSERT INTO reminder_deliveries (family_id, revisit_reminder_id, id, status)
      VALUES ($1,$2,$3,'pending')`,
      [familyId, id, randomUUID()],
    );
    return id;
  };
  const put = (id: string, revisitDate: string | null) =>
    t.call(main, 'PUT', `${base}/prescriptions/${id}/revisit-date`, { revisitDate });
  const reminders = async () =>
    (
      await t.owner.query(
        `SELECT id, revisit_date::text AS date,
    offset_kind, send_date::text, scheduled_at, sent_at FROM revisit_reminders
    WHERE health_profile_id=$1 ORDER BY revisit_date, offset_kind`,
        [profile.id],
      )
    ).rows;
  return { familyId, main, profile, base, add, reminder, put, reminders };
}
