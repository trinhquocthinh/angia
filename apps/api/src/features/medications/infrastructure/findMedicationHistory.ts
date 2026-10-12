import { and, eq } from 'drizzle-orm';
import { fromNumeric } from '@src/shared/db/numericColumn.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { medicationCourses, prescriptionItems, prescriptions } from '@src/shared/db/schema/index.js';
import type { DoseSlot } from '@src/features/prescriptions/domain/Prescription.js';
import type { CurrentMedicationCourse } from '../application/managementPorts.js';
// Mọi trạng thái của hồ sơ; kèm hàm lượng và ngày kê từ đơn nguồn (đợt tự khai báo không có đơn).
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
    ({ course, strength, issuedDate }) =>
      ({
        ...course,
        strength: course.strength ?? strength,
        quantityPerDose: fromNumeric(course.quantityPerDose),
        slots: course.slots as DoseSlot[],
        prescriptionIssuedDate: issuedDate,
      }) as CurrentMedicationCourse,
  );
}
