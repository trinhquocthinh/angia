import { randomUUID } from 'node:crypto';
import type pg from 'pg';

const MONTH = '2026-10';

// Mỗi bảng RLS không có cột hồ sơ (TC-568) có ít nhất một dòng của gia đình; extractions đã có từ seedTwoFamilies.
export async function seedFamilyOnlyRows(owner: pg.Client, familyId: string, profileId: string) {
  const { rows } = await owner.query<{ id: string }>(
    'SELECT id FROM source_documents WHERE health_profile_id = $1',
    [profileId],
  );
  const documentId = rows[0]?.id;
  const accountId = randomUUID();
  const deviceId = randomUUID();
  const reminderId = randomUUID();
  await owner.query(
    `INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role)
     VALUES($1::uuid,$1::text,'Người chăm',$2,'main')`,
    [accountId, familyId],
  );
  await owner.query(`INSERT INTO extraction_spend(month,cap_usd) VALUES($1,10) ON CONFLICT DO NOTHING`, [
    MONTH,
  ]);
  await owner.query(`INSERT INTO scan_quota_months(month) VALUES($1) ON CONFLICT DO NOTHING`, [MONTH]);
  await owner.query(
    `INSERT INTO extraction_reservations(source_document_id,family_id,month,amount_usd) VALUES($1,$2,$3,1)`,
    [documentId, familyId, MONTH],
  );
  await owner.query(
    `INSERT INTO ocr_operations(source_document_id,family_id,month,state) VALUES($1,$2,$3,'held')`,
    [documentId, familyId, MONTH],
  );
  await owner.query(`INSERT INTO family_extraction_spend(family_id,month) VALUES($1,$2)`, [familyId, MONTH]);
  await owner.query(
    `INSERT INTO family_scan_quotas(family_id,month,status,granted_scans,updated_at) VALUES($1,$2,'default',10,now())`,
    [familyId, MONTH],
  );
  await owner.query(
    `INSERT INTO scan_quota_audit(id,family_id,month,version,actor_id,occurred_at,after,reason)
     VALUES($1,$2,$3,1,$4,now(),'{}','Cấp lượt')`,
    [randomUUID(), familyId, MONTH, accountId],
  );
  await owner.query(`INSERT INTO object_purges(object_key,family_id) VALUES($1,$2)`, [
    `purge-${familyId}`,
    familyId,
  ]);
  await owner.query(
    `INSERT INTO push_subscriptions(id,family_id,account_id,authorized_at,endpoint,endpoint_hash,p256dh,auth)
     VALUES($1,$2,$3,now(),$4,$5,'p','a')`,
    [deviceId, familyId, accountId, `https://push.example/${deviceId}`, deviceId],
  );
  await owner.query(
    `INSERT INTO reminders(id,family_id,health_profile_id,date,slot,scheduled_at,medications)
     VALUES($1,$2,$3,'2026-10-31','morning',now(),'[{}]')`,
    [reminderId, familyId, profileId],
  );
  await owner.query(
    `INSERT INTO reminder_deliveries(id,family_id,reminder_id,push_subscription_id,status)
     VALUES($1,$2,$3,$4,'pending')`,
    [randomUUID(), familyId, reminderId, deviceId],
  );
}

// Dòng của một hồ sơ ở các bảng đại diện cho mỗi dạng policy: cột hồ sơ, profile_id và bảng con EXISTS.
export async function seedProfileRows(owner: pg.Client, familyId: string, profileId: string) {
  const prescriptionId = randomUUID();
  await owner.query(
    `INSERT INTO measurements(id,family_id,health_profile_id,kind,measured_on,systolic,diastolic,manual_without_source)
     VALUES($1,$2,$3,'blood_pressure','2026-10-02',120,80,true)`,
    [randomUUID(), familyId, profileId],
  );
  await owner.query(
    `INSERT INTO prescriptions(id,family_id,health_profile_id,issued_date,manual_without_source)
     VALUES($1,$2,$3,'2026-10-01',true)`,
    [prescriptionId, familyId, profileId],
  );
  await owner.query(
    `INSERT INTO prescription_items(id,family_id,prescription_id,position,name,name_normalized,quantity_per_dose,slots,duration_days,long_term)
     VALUES($1,$2,$3,0,'Canxi','canxi',1,ARRAY['morning'],7,false)`,
    [randomUUID(), familyId, prescriptionId],
  );
  await owner.query(
    `INSERT INTO consent_invitations(id,family_id,profile_id,token_hash,expires_at)
     VALUES($1,$2,$3,$4,now() + interval '1 day')`,
    [randomUUID(), familyId, profileId, randomUUID()],
  );
  await owner.query(
    `INSERT INTO profile_link_invitations(id,family_id,profile_id,token_hash,expires_at)
     VALUES($1,$2,$3,$4,now() + interval '1 day')`,
    [randomUUID(), familyId, profileId, randomUUID()],
  );
  await owner.query(
    `INSERT INTO profile_link_events(id,family_id,profile_id,action,actor_role) VALUES($1,$2,$3,'link','invitee')`,
    [randomUUID(), familyId, profileId],
  );
}
