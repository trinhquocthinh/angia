import { and, eq } from 'drizzle-orm';
import { medicationCourses, prescriptionItems } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { AsNeededCourse } from '../domain/AsNeededDose.js';

// Khóa chia sẻ đợt để lệnh dừng đợt đồng thời không đổi hiệu lực giữa lúc kiểm và lúc ghi.
export async function findAsNeededCourse(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  courseId: string,
): Promise<AsNeededCourse | null> {
  const [row] = await tx
    .select({
      id: medicationCourses.id,
      prescriptionItemId: medicationCourses.prescriptionItemId,
      slots: medicationCourses.slots,
      startDate: medicationCourses.startDate,
      endDate: medicationCourses.endDate,
      minIntervalText: prescriptionItems.minIntervalText,
      userIntervalText: medicationCourses.userIntervalText,
    })
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
        eq(medicationCourses.id, courseId),
        eq(medicationCourses.familyId, familyId),
        eq(medicationCourses.healthProfileId, profileId),
      ),
    )
    .for('share', { of: medicationCourses });
  return row ?? null;
}
