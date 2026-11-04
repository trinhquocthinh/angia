import { and, eq, sql } from 'drizzle-orm';
import { resolveDoseInterval } from '@src/features/asNeededDoses/domain/resolveDoseInterval.js';
import { fromNumeric } from '@src/shared/db/numericColumn.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import {
  asNeededDoses,
  medicationCourses,
  prescriptionItems,
  prescriptions,
} from '@src/shared/db/schema/index.js';
import type { DoseSlot } from '@src/features/prescriptions/domain/Prescription.js';
import type { CurrentMedicationCourse } from '../application/managementPorts.js';
// Mọi trạng thái của hồ sơ; kèm hàm lượng và ngày kê từ đơn nguồn (đợt tự khai báo không có đơn).
// Liều gần nhất và khoảng cách chỉ có ở đợt "Khi cần" (CHECK DB chặn khoảng cách trên đợt khác).
export async function findMedicationHistory(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
): Promise<CurrentMedicationCourse[]> {
  const rows = await tx
    .select({
      course: medicationCourses,
      strength: prescriptionItems.strength,
      issuedDate: prescriptions.issuedDate,
      minIntervalText: prescriptionItems.minIntervalText,
      lastDoseAt: sql<Date | null>`(SELECT max(${asNeededDoses.givenAt}) FROM ${asNeededDoses}
        WHERE ${asNeededDoses.medicationCourseId} = ${medicationCourses.id})`.mapWith(asNeededDoses.givenAt),
    })
    .from(medicationCourses)
    .leftJoin(
      prescriptionItems,
      and(
        eq(prescriptionItems.id, medicationCourses.prescriptionItemId),
        eq(prescriptionItems.familyId, familyId),
      ),
    )
    .leftJoin(
      prescriptions,
      and(eq(prescriptions.id, prescriptionItems.prescriptionId), eq(prescriptions.familyId, familyId)),
    )
    .where(and(eq(medicationCourses.familyId, familyId), eq(medicationCourses.healthProfileId, profileId)))
    .orderBy(medicationCourses.startDate, medicationCourses.name, medicationCourses.id);
  return rows.map(
    ({ course: { userIntervalText, ...course }, strength, issuedDate, minIntervalText, lastDoseAt }) =>
      ({
        ...course,
        strength: course.strength ?? strength,
        quantityPerDose: fromNumeric(course.quantityPerDose),
        slots: course.slots as DoseSlot[],
        prescriptionIssuedDate: issuedDate,
        lastDoseAt,
        interval: resolveDoseInterval(minIntervalText, userIntervalText),
      }) as CurrentMedicationCourse,
  );
}
