import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { seedDataExport } from './seedDataExport.test-helper.js';

export async function seedDataExportWindow(owner: pg.Client) {
  const seed = await seedDataExport(owner);
  for (const profile of [seed.mother, seed.father]) {
    await owner.query(
      `INSERT INTO consent_invitations(id, family_id, profile_id, token_hash, invited_by_account_id,
       expires_at, decision, respondent_name, basis, inviter_attested_at, responded_at)
       VALUES ($1,$2,$3,$4,$5,now()+interval '1 day','accepted',$6,'self',now(),now())`,
      [randomUUID(), seed.familyId, profile.id, randomUUID(), profile.accountId, profile.marker],
    );
    await owner.query(
      `INSERT INTO consent_legacy_attestations(profile_id, family_id, confirmed_by_account_id, confirmed_at, basis)
       VALUES ($1,$2,$3,now(),'self')`,
      [profile.id, seed.familyId, profile.accountId],
    );
    await owner.query(
      `INSERT INTO profile_link_events(id, family_id, profile_id, action, actor_account_id,
       actor_role, from_account_id, to_account_id) VALUES ($1,$2,$3,'unlink',$4,'owner',$4,$4)`,
      [randomUUID(), seed.familyId, profile.id, profile.accountId],
    );
  }
  await owner.query(
    `UPDATE health_profiles SET consent_status='withdrawn',consent_withdrawn_at=now() WHERE id=$1`,
    [seed.mother.id],
  );
  return seed;
}
