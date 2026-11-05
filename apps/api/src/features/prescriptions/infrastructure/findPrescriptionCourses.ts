import { and, eq } from 'drizzle-orm';
import type { MedicationCourse } from '@src/features/medications/domain/MedicationCourse.js';
import { fromNumeric } from '@src/shared/db/numericColumn.js';
import { medicationCourses, prescriptionItems } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { DoseSlot } from '../domain/Prescription.js';

export async function findPrescriptionCourses(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  prescriptionId: string,
): Promise<MedicationCourse[]> {
  const rows = await tx
    .select({ course: medicationCourses, strength: prescriptionItems.strength })
    .from(medicationCourses)
    .innerJoin(
      prescriptionItems,
      and(
        eq(prescriptionItems.id, medicationCourses.prescriptionItemId),
        eq(prescriptionItems.familyId, familyId),
        eq(prescriptionItems.prescriptionId, prescriptionId),
      ),
    )
    .where(and(eq(medicationCourses.familyId, familyId), eq(medicationCourses.healthProfileId, profileId)))
    .orderBy(medicationCourses.startDate, medicationCourses.id);
  return rows.map(
    ({ course, strength }) =>
      ({
        ...course,
        strength: course.strength ?? strength,
        quantityPerDose: fromNumeric(course.quantityPerDose),
        slots: course.slots as DoseSlot[],
      }) as MedicationCourse,
  );
}
