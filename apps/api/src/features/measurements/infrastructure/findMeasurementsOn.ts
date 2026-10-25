import { and, asc, eq } from 'drizzle-orm';
import { measurements } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { Measurement, MeasurementKind } from '../domain/Measurement.js';
import { toDbKind, toMeasurement } from './measurementRows.js';

// Số đo đã lưu của hồ sơ cùng loại trong một ngày đo, kể cả bản nhập trực tiếp (SPEC-012).
export async function findMeasurementsOn(
  tx: FamilyScopedTx,
  familyId: string,
  healthProfileId: string,
  kind: MeasurementKind,
  measuredOn: string,
): Promise<Measurement[]> {
  const rows = await tx
    .select()
    .from(measurements)
    .where(
      and(
        eq(measurements.familyId, familyId),
        eq(measurements.healthProfileId, healthProfileId),
        eq(measurements.kind, toDbKind(kind)),
        eq(measurements.measuredOn, measuredOn),
      ),
    )
    .orderBy(asc(measurements.createdAt), asc(measurements.id));
  return rows.map(toMeasurement);
}
