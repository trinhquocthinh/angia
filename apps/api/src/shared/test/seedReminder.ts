import { randomUUID } from 'node:crypto';
import type pg from 'pg';

export const SEEDED_MEDICATIONS = [
  { courseId: randomUUID(), name: 'Canxi', strength: '500 mg', quantityPerDose: '1', doseUnit: 'viên' },
  { courseId: randomUUID(), name: 'Vitamin D', strength: null, quantityPerDose: null, doseUnit: null },
];

// Lời nhắc buổi sáng 2026-10-23 (07:00 giờ Việt Nam) chèn bằng role owner, như job generate-reminders ghi;
// kèm chỉ định người nhận nếu truyền recipientAccountId.
export async function seedReminder(
  owner: pg.Client,
  familyId: string,
  profileId: string,
  recipientAccountId?: string,
): Promise<string> {
  const id = randomUUID();
  await owner.query(
    `INSERT INTO reminders(id,family_id,health_profile_id,date,slot,scheduled_at,medications)
     VALUES ($1,$2,$3,'2026-10-23','morning','2026-10-23T00:00:00.000Z',$4::jsonb)`,
    [id, familyId, profileId, JSON.stringify(SEEDED_MEDICATIONS)],
  );
  if (recipientAccountId)
    await owner.query(
      'INSERT INTO reminder_recipients(health_profile_id,family_id,account_id) VALUES ($1,$2,$3)',
      [profileId, familyId, recipientAccountId],
    );
  return id;
}
