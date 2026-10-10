import { medicationCourses } from '@src/shared/db/schema/index.js';
import { newId } from '@src/shared/db/schema/newId.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { MedicationCourse, NewMedicationCourse } from '../domain/MedicationCourse.js';

// Dùng transaction hiện có của lệnh duyệt, không mở transaction riêng hoặc nuốt lỗi ghi DB.
export async function insertMedicationCourses(
  tx: FamilyScopedTx,
  familyId: string,
  inputs: readonly NewMedicationCourse[],
): Promise<MedicationCourse[]> {
  if (inputs.length === 0) return [];
  const courses = inputs.map((input) => ({ ...input, id: newId() }));
  await tx.insert(medicationCourses).values(
    courses.map((course) => ({
      ...course,
      familyId,
      quantityPerDose: String(course.quantityPerDose),
      slots: [...course.slots],
    })),
  );
  return courses;
}
