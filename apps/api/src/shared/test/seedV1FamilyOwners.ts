import { randomUUID } from 'node:crypto';
import type pg from 'pg';

async function seedFamily(client: pg.ClientBase, index: number) {
  const [family, owner, creator, profile, course, reminder, batch, document] = Array.from({ length: 8 }, () =>
    randomUUID(),
  ) as [string, string, string, string, string, string, string, string];
  await client.query("INSERT INTO families(id,name) VALUES($1,'Nhà thử')", [family]);
  await client.query(
    `INSERT INTO accounts(id,display_name,family_id,family_role)
       VALUES($1,'Chủ hộ thử',$3,'main'),($2,'Người tạo thử',$3,$4)`,
    [owner, creator, family, index === 1 ? 'member' : 'main'],
  );
  await client.query(
    `INSERT INTO health_profiles(id,family_id,display_name,birth_year)
       VALUES($1,$2,'Bé thử',extract(year FROM now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int-10)`,
    [profile, family],
  );
  return { family, owner, creator, profile, course, reminder, batch, document };
}

// Chỉ dùng cho PostgreSQL Testcontainers; mỗi bảng cần đối chiếu có dữ liệu giả khác rỗng.
export async function seedV1FamilyOwners(client: pg.ClientBase) {
  await client.query(`INSERT INTO scan_quota_months(month,committed_remaining_scans,quota_families,used_scans)
    VALUES('2026-11',24,3,6) ON CONFLICT(month) DO UPDATE SET
    committed_remaining_scans=24,quota_families=3,used_scans=6`);
  const families = [];
  for (let index = 0; index < 3; index++) {
    const { family, owner, creator, profile, course, reminder, batch, document } = await seedFamily(
      client,
      index,
    );
    await client.query(
      `INSERT INTO medication_courses(id,family_id,health_profile_id,source,name,name_normalized,
       quantity_per_dose,slots,start_date,status)
       VALUES($1,$2,$3,'self_reported','Thuốc thử','thuoc thu',1,ARRAY['morning'],current_date,'active')`,
      [course, family, profile],
    );
    await client.query(
      `INSERT INTO reminders(id,family_id,health_profile_id,date,slot,scheduled_at,medications)
       VALUES($1,$2,$3,current_date,'morning',now(),'[{"name":"Thuốc thử"}]')`,
      [reminder, family, profile],
    );
    await client.query(
      `INSERT INTO dose_confirmations(id,family_id,health_profile_id,date,slot,reminder_id,
       confirmed_by_account_id,confirmed_by_name,confirmed_at)
       VALUES($1,$2,$3,current_date,'morning',$4,$5,'Người thử',now())`,
      [randomUUID(), family, profile, reminder, owner],
    );
    await client.query(
      'INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES($1,$2,$3,$4)',
      [batch, family, profile, owner],
    );
    await client.query(
      `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,mime_type,size_bytes)
       VALUES($1,$2,$3,$4,'uploaded','image/jpeg',100)`,
      [document, family, profile, batch],
    );
    await client.query(
      `INSERT INTO extractions(id,family_id,source_document_id,provider,model,payload,cost_usd)
       VALUES($1,$2,$3,'fake','fake','{}',0)`,
      [randomUUID(), family, document],
    );
    await client.query(
      `INSERT INTO family_scan_quotas(family_id,month,status,granted_scans,used_scans,updated_at)
      VALUES($1,'2026-11','default',10,2,now())`,
      [family],
    );
    await client.query(
      `INSERT INTO ocr_operations(source_document_id,family_id,month,state,dispatch_attempts,dispatched_at)
      VALUES($1,$2,'2026-11','dispatched',1,now())`,
      [document, family],
    );
    families.push({ family, owner, creator: index === 2 ? randomUUID() : creator, profile });
  }
  return families;
}
