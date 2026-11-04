import { randomUUID } from 'node:crypto';
import type { ProfileTestApp } from './startProfileTestApp.js';

// Hai nguồn E15 tại cùng phút với số đo; UTC ngày trước đã sang ngày 30 ở Việt Nam.
export async function seedTimelineExtraData(
  t: ProfileTestApp,
  f: { familyId: string; profile: { id: string }; prescriptionId: string },
) {
  const [itemId, courseId, doseId, temperatureId] = Array.from({ length: 4 }, () => randomUUID());
  await t.owner.query(
    `INSERT INTO prescription_items
      (id,family_id,prescription_id,position,name,name_normalized,slots,duration_days,long_term)
     VALUES ($1,$2,$3,1,'Paracetamol','paracetamol',ARRAY['as_needed'],31,false)`,
    [itemId, f.familyId, f.prescriptionId],
  );
  await t.owner.query(
    `INSERT INTO medication_courses
      (id,family_id,health_profile_id,prescription_item_id,source,name,name_normalized,slots,start_date,end_date,status)
     VALUES ($1,$2,$3,$4,'prescription','Paracetamol','paracetamol',ARRAY['as_needed'],'2026-10-01','2026-10-31','active')`,
    [courseId, f.familyId, f.profile.id, itemId],
  );
  await t.owner.query(
    `INSERT INTO as_needed_doses(id,family_id,health_profile_id,medication_course_id,given_at,quantity,unit)
     VALUES ($1,$2,$3,$4,'2026-10-30T02:00:59Z',0.5,'gói')`,
    [doseId, f.familyId, f.profile.id, courseId],
  );
  await t.owner.query(
    `INSERT INTO temperature_readings(id,family_id,health_profile_id,celsius,measured_at)
     VALUES ($1,$2,$3,38.5,'2026-10-30T02:00:01Z')`,
    [temperatureId, f.familyId, f.profile.id],
  );
  return { courseId: courseId!, doseId: doseId!, temperatureId: temperatureId! };
}
