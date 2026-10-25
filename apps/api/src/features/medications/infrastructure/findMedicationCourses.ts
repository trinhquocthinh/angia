import { and, eq } from 'drizzle-orm';
import { fromNumeric } from '@src/shared/db/numericColumn.js';
import { medicationCourses, prescriptionItems } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { DoseSlot } from '@src/features/prescriptions/domain/Prescription.js';
import type { ConflictCourse } from '../domain/MedicationConflict.js';

export async function findMedicationCourses(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
): Promise<ConflictCourse[]> {
  const rows = await tx
    .select({ course: medicationCourses, strength: prescriptionItems.strength })
    .from(medicationCourses)
    .leftJoin(
      prescriptionItems,
      and(
        eq(prescriptionItems.id, medicationCourses.prescriptionItemId),
        eq(prescriptionItems.familyId, familyId),
      ),
    )
    .where(
      and(
        eq(medicationCourses.familyId, familyId),
        eq(medicationCourses.healthProfileId, profileId),
        eq(medicationCourses.status, 'active'),
      ),
    )
    .orderBy(medicationCourses.startDate, medicationCourses.id);
  return rows.map(({ course, strength }) => ({
    ...course,
    strength: course.strength ?? strength,
    status: 'active' as const,
    quantityPerDose: fromNumeric(course.quantityPerDose),
    slots: course.slots as DoseSlot[],
  }));
}
