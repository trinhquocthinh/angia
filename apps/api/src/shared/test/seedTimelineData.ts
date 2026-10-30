import { randomUUID } from 'node:crypto';
import { createRevisitFixture } from './createRevisitFixture.js';
import type { ProfileTestApp } from './startProfileTestApp.js';

// Bản ghi nhập tay và nguồn chưa duyệt dùng để kiểm riêng bộ lọc của timeline.
export async function seedTimelineData(t: ProfileTestApp) {
  const f = await createRevisitFixture(t);
  const prescriptionId = await f.add('2026-10-30', '2026-10-01');
  const itemId = randomUUID();
  await t.owner.query(
    `INSERT INTO prescription_items
    (id,family_id,prescription_id,position,name,name_normalized,strength,quantity_per_dose,dose_unit,slots,duration_days,long_term)
    VALUES ($1,$2,$3,0,'Thuốc A','thuốc a','5mg',1,'viên',ARRAY['morning'],7,false)`,
    [itemId, f.familyId, prescriptionId],
  );
  const courseId = randomUUID();
  await t.owner.query(
    `INSERT INTO medication_courses
    (id,family_id,health_profile_id,prescription_item_id,source,name,name_normalized,quantity_per_dose,dose_unit,slots,start_date,end_date,status)
    VALUES ($1,$2,$3,$4,'prescription','Thuốc A','thuốc a',1,'viên',ARRAY['morning'],'2026-10-01','2026-10-29','stopped')`,
    [courseId, f.familyId, f.profile.id, itemId],
  );
  await t.owner.query(
    `INSERT INTO adherence_periods
    (id,family_id,health_profile_id,medication_name,medication_name_normalized,status,from_date,recorded_by)
    VALUES ($4,$1,$2,'Thuốc A','thuốc a','taking','2026-10-30',$3)`,
    [f.familyId, f.profile.id, f.main.accountId, randomUUID()],
  );
  const measure = async (time: string | null, date = '2026-10-30', documentId: string | null = null) => {
    const id = randomUUID();
    await t.owner.query(
      `INSERT INTO measurements
      (id,family_id,health_profile_id,kind,measured_on,measured_time,systolic,diastolic,manual_without_source,source_document_id)
      VALUES ($1,$2,$3,'blood_pressure',$4,$5,120,80,$6,$7)`,
      [id, f.familyId, f.profile.id, date, time, !documentId, documentId],
    );
    return id;
  };
  const labs = async (created: string, documentId: string | null = null) => {
    const ids = [randomUUID(), randomUUID()].sort();
    for (const [i, id] of ids.entries())
      await t.owner.query(
        `INSERT INTO lab_results
      (id,family_id,health_profile_id,result_date,test_name,test_name_normalized,value,unit,facility,created_at,manual_without_source,source_document_id)
      VALUES ($1,$2,$3,'2026-10-30',$4,$4,'5','mmol/L','Phòng khám A',$5,$6,$7)`,
        [id, f.familyId, f.profile.id, `Chỉ số ${i}`, created, !documentId, documentId],
      );
    return documentId ?? ids[0]!;
  };
  return { ...f, prescriptionId, itemId, courseId, measure, labs, path: `${f.base}/timeline` };
}
