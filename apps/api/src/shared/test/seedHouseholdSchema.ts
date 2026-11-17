import { randomUUID } from 'node:crypto';
import type pg from 'pg';

// Dữ liệu hợp lệ cho năm bảng RLS, dùng chung phép kiểm trên role app thật.
export async function seedHouseholdSchema(
  owner: pg.Client,
  familyId: string,
  profileId: string,
  accountId: string,
  targetAccountId: string,
) {
  await owner.query(
    `INSERT INTO family_invitations(id,kind,family_id,role,token_hash,code_hash,created_by,expires_at)
     VALUES($1,'join_family',$2,'member',$3,$4,$5,now()+interval '7 days')`,
    [randomUUID(), familyId, randomUUID(), randomUUID(), accountId],
  );
  await owner.query(
    `INSERT INTO ownership_transfer_offers(id,family_id,from_account_id,to_account_id)
     VALUES($1,$2,$3,$4)`,
    [randomUUID(), familyId, accountId, targetAccountId],
  );
  await owner.query(
    `INSERT INTO family_deletion_requests(id,family_id,requested_by,execute_at)
     VALUES($1,$2,$3,now()+interval '24 hours')`,
    [randomUUID(), familyId, accountId],
  );
  await owner.query(
    'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
    [profileId, familyId, accountId],
  );
  await owner.query(
    `INSERT INTO removed_member_windows(account_id,family_id,health_profile_id,expires_at)
     VALUES($1,$2,$3,now()+interval '168 hours')`,
    [targetAccountId, familyId, profileId],
  );
}
