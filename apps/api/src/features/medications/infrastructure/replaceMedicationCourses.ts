import { and, eq, inArray } from 'drizzle-orm';
import { medicationCourses } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

export async function replaceMedicationCourses(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  ids: readonly string[],
  endDate: string,
): Promise<void> {
  if (ids.length === 0) return;
  const rows = await tx
    .update(medicationCourses)
    .set({ status: 'replaced', endDate })
    .where(
      and(
        eq(medicationCourses.familyId, familyId),
        eq(medicationCourses.healthProfileId, profileId),
        eq(medicationCourses.status, 'active'),
        inArray(medicationCourses.id, [...ids]),
      ),
    )
    .returning({ id: medicationCourses.id });
  if (rows.length !== ids.length) throw new Error('Danh sách đợt cần thay thế đã thay đổi');
}
