import { randomUUID } from 'node:crypto';
import type pg from 'pg';

export async function seedDataExport(owner: pg.Client) {
  const familyId = randomUUID();
  const otherFamilyId = randomUUID();
  await owner.query(`INSERT INTO families(id,name) VALUES ($1,'Nhà chính'),($2,'Nhà khác')`, [
    familyId,
    otherFamilyId,
  ]);
  const mother = await seedProfile(owner, familyId, 'me_marker', true);
  const father = await seedProfile(owner, familyId, 'bo_marker', true);
  const child = await seedProfile(owner, familyId, 'be_marker', false);
  const foreign = await seedProfile(owner, otherFamilyId, 'f2_marker', false);
  const versionId = randomUUID();
  await owner.query(
    `INSERT INTO legal_document_versions(id,kind,version,published_at,material,content_path,sha256)
    VALUES ($1,'terms',$3,now(),false,'terms.md',$2)`,
    [versionId, 'a'.repeat(64), versionId],
  );
  for (const profile of [mother, father]) {
    await owner.query(`INSERT INTO legal_acceptances(id,account_ref,version_id) VALUES ($1,$2,$3)`, [
      randomUUID(),
      profile.legalRef,
      versionId,
    ]);
  }
  await owner.query(`INSERT INTO account_credentials(account_id,password_hash) VALUES ($1,$2)`, [
    mother.accountId,
    '$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$c2VjcmV0',
  ]);
  return { familyId, otherFamilyId, mother, father, child, foreign, versionId };
}
async function seedProfile(owner: pg.Client, familyId: string, marker: string, linked: boolean) {
  const id = randomUUID();
  const accountId = randomUUID();
  const legalRef = randomUUID();
  const documentId = randomUUID();
  const uploadedId = randomUUID();
  const key = `families/${familyId}/profiles/${id}/documents/${documentId}/sanitized.jpg`;
  await owner.query(
    `INSERT INTO accounts(id,display_name,username_normalized,email,family_id,family_role,legal_ref)
    VALUES ($1,$2,$2,$3,$4,'main',$5)`,
    [accountId, marker, `${marker}@example.test`, familyId, legalRef],
  );
  await owner.query(`INSERT INTO health_profiles(id,family_id,display_name) VALUES ($1,$2,$3)`, [
    id,
    familyId,
    marker,
  ]);
  if (linked) await owner.query(`UPDATE accounts SET health_profile_id=$2 WHERE id=$1`, [accountId, id]);
  const batchId = randomUUID();
  await owner.query(
    `INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES ($1,$2,$3,$4)`,
    [batchId, familyId, id, accountId],
  );
  await owner.query(
    `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,image_key,image_sha256,mime_type,size_bytes)
    VALUES ($1,$2,$3,$4,'pending_review',$5,$6,'image/jpeg',3),
    ($7,$2,$3,$4,'uploaded',$8,NULL,'image/jpeg',3)`,
    [
      documentId,
      familyId,
      id,
      batchId,
      key,
      'b'.repeat(64),
      uploadedId,
      `families/${familyId}/profiles/${id}/documents/${uploadedId}/upload.jpg`,
    ],
  );
  await seedClinicalRows(owner, familyId, id, marker);
  return { id, accountId, legalRef, documentId, uploadedId, key, marker };
}
async function seedClinicalRows(owner: pg.Client, familyId: string, profileId: string, marker: string) {
  const prescriptionId = randomUUID();
  await owner.query(
    `INSERT INTO prescriptions(id,family_id,health_profile_id,issued_date,facility,manual_without_source)
    VALUES ($1,$2,$3,'2026-11-01',$4,true)`,
    [prescriptionId, familyId, profileId, marker],
  );
  await owner.query(
    `INSERT INTO prescription_items(id,family_id,prescription_id,position,name,name_normalized,quantity_per_dose,slots,long_term)
    VALUES ($1,$2,$3,1,$4,$4,1,ARRAY['morning'],true)`,
    [randomUUID(), familyId, prescriptionId, marker],
  );
  await owner.query(
    `INSERT INTO temperature_readings(id,family_id,health_profile_id,celsius,measured_at)
    VALUES ($1,$2,$3,37.1,now())`,
    [randomUUID(), familyId, profileId],
  );
  await owner.query(
    `INSERT INTO measurements(id,family_id,health_profile_id,kind,measured_on,glucose_value,glucose_unit,manual_without_source)
    VALUES ($1,$2,$3,'blood_glucose','2026-11-01',5.7,'mmol/L',true)`,
    [randomUUID(), familyId, profileId],
  );
}
