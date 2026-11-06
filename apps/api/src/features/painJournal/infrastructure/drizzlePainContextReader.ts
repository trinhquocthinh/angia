import { and, asc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import type { PainContext } from '@angia/contracts';
import { medicationCourses as courses } from '@src/shared/db/schema/index.js';
import { readPainContextDoses } from './readPainContextDoses.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

export async function drizzlePainContextReader(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  from: string,
  to: string,
): Promise<Pick<PainContext, 'asNeededDoses' | 'courses'>> {
  const overlapping = await tx
    .select({
      courseId: courses.id,
      name: courses.name,
      startDate: courses.startDate,
      endDate: courses.endDate,
      status: courses.status,
    })
    .from(courses)
    .where(
      and(
        eq(courses.familyId, familyId),
        eq(courses.healthProfileId, profileId),
        lte(courses.startDate, to),
        or(isNull(courses.endDate), gte(courses.endDate, from)),
      ),
    )
    .orderBy(asc(courses.startDate), asc(courses.id));
  return {
    asNeededDoses: await readPainContextDoses(tx, familyId, profileId, from, to),
    courses: overlapping,
  };
}
