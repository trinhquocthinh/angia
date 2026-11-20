import { randomUUID } from 'node:crypto';
import type { ProfileTestApp } from './startProfileTestApp.js';

// Dữ liệu tổng hợp, chèn bằng owner để chuẩn bị kiểm quyền role app.
export async function seedMembershipProfile(
  t: ProfileTestApp,
  familyId: string,
  actorId: string,
  birthYear: number | null = null,
): Promise<string> {
  const id = randomUUID();
  await t.owner.query(
    `INSERT INTO health_profiles(id,family_id,display_name,birth_year,consent_status,
      consent_source,consent_confirmed_at,consent_confirmed_by,consent_basis,consent_respondent_name)
     VALUES($1,$2,'Hồ sơ thử',$3,'confirmed','main_attested',now(),$4,'self','Người thử')`,
    [id, familyId, birthYear, actorId],
  );
  return id;
}
