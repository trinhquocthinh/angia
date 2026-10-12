import { and, asc, between, eq, sql } from 'drizzle-orm';
import { measurements } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { Measurement, MeasurementKind } from '../domain/Measurement.js';
import { toDbKind, toMeasurement } from './measurementRows.js';

// SPEC-020: dùng chỉ mục (health_profile_id, kind, measured_on); cũ nhất trước — đúng thứ tự ngược trang danh sách.
export async function listMeasurementsBetween(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  kind: MeasurementKind,
  from: string,
  to: string,
): Promise<Measurement[]> {
  const rows = await tx
    .select()
    .from(measurements)
    .where(
      and(
        eq(measurements.familyId, familyId),
        eq(measurements.healthProfileId, profileId),
        eq(measurements.kind, toDbKind(kind)),
        between(measurements.measuredOn, from, to),
      ),
    )
    .orderBy(
      asc(measurements.measuredOn),
      sql`${measurements.measuredTime} ASC NULLS FIRST`,
      asc(measurements.createdAt),
      asc(measurements.id),
    );
  return rows.map(toMeasurement);
}
