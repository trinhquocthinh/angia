import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { asNeededDoses as doses, medicationCourses as courses } from '@src/shared/db/schema/index.js';
import { fromNumeric } from '@src/shared/db/numericColumn.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

export async function readPainContextDoses(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  from: string,
  to: string,
) {
  const start = new Date(`${from}T00:00:00+07:00`);
  const end = new Date(Date.parse(`${to}T00:00:00+07:00`) + 86_400_000);
  const rows = await tx
    .select({
      courseId: courses.id,
      name: courses.name,
      givenAt: doses.givenAt,
      quantity: doses.quantity,
      unit: doses.unit,
    })
    .from(doses)
    .innerJoin(
      courses,
      and(
        eq(doses.medicationCourseId, courses.id),
        eq(doses.familyId, courses.familyId),
        eq(doses.healthProfileId, courses.healthProfileId),
      ),
    )
    .where(
      and(
        eq(doses.familyId, familyId),
        eq(doses.healthProfileId, profileId),
        gte(doses.givenAt, start),
        lt(doses.givenAt, end),
      ),
    )
    .orderBy(asc(doses.givenAt), asc(doses.id));
  return rows.map((row) => ({
    ...row,
    givenAt: row.givenAt.toISOString(),
    quantity: fromNumeric(row.quantity),
  }));
}
