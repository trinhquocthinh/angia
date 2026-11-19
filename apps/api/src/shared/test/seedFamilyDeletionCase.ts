import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { FAMILY_DELETION_ROLE } from './expectedRlsPolicies.js';

export type DeletionCaseState = 'due' | 'none' | 'revoked' | 'not_due';

// TC-869: một nhà có Chủ hộ (gắn hồ sơ của mình) và yêu cầu xoá theo trạng thái; `extraMembers` thêm người.
export async function seedFamilyDeletionCase(owner: pg.Client, state: DeletionCaseState, extraMembers = 0) {
  const family = randomUUID();
  const account = randomUUID();
  const profile = randomUUID();
  const request = randomUUID();
  await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà xoá')", [family]);
  await owner.query(
    `INSERT INTO health_profiles(id,family_id,display_name,birth_year) VALUES($1,$2,'Chủ hộ',1960)`,
    [profile, family],
  );
  await owner.query(
    `INSERT INTO accounts(id,display_name,family_id,family_role,health_profile_id)
     VALUES($1,'Chủ hộ',$2,'main',$3)`,
    [account, family, profile],
  );
  await owner.query('UPDATE families SET owner_account_id=$2 WHERE id=$1', [family, account]);
  for (let index = 0; index < extraMembers; index += 1) {
    await owner.query(
      "INSERT INTO accounts(id,display_name,family_id,family_role) VALUES($1,'Thành viên',$2,'member')",
      [randomUUID(), family],
    );
  }
  if (state !== 'none') {
    const timing =
      state === 'not_due'
        ? "now(),now()+interval '1 hour'"
        : "now()-interval '2 days',now()-interval '1 day'";
    await owner.query(
      `INSERT INTO family_deletion_requests(id,family_id,requested_by,created_at,execute_at)
       VALUES($1,$2,$3,${timing})`,
      [request, family, account],
    );
  }
  if (state === 'revoked') {
    await owner.query("UPDATE family_deletion_requests SET status='revoked',revoked_at=now() WHERE id=$1", [
      request,
    ]);
  }
  return { family, account, profile, request };
}

// Giống withFamilyScope (GUC cục bộ) rồi SET LOCAL ROLE như worker; mặc định ROLLBACK để giữ fixture.
export async function asFamilyDeletionRole<T>(
  client: pg.Client,
  familyId: string | null,
  work: () => Promise<T>,
  commit = false,
): Promise<T> {
  await client.query('BEGIN');
  try {
    if (familyId) await client.query("SELECT set_config('app.family_id',$1,true)", [familyId]);
    await client.query(`SET LOCAL ROLE ${FAMILY_DELETION_ROLE}`);
    const result = await work();
    await client.query(commit ? 'COMMIT' : 'ROLLBACK');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
