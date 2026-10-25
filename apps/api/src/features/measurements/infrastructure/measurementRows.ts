import type { measurements } from '@src/shared/db/schema/index.js';
import type { Measurement, NewMeasurement } from '../domain/Measurement.js';

type MeasurementRow = typeof measurements.$inferSelect;

// Cột DB dùng `blood_glucose` và numeric (chuỗi); hợp đồng API dùng `glucose` và number.
export const toDbKind = (kind: Measurement['kind']): MeasurementRow['kind'] =>
  kind === 'glucose' ? 'blood_glucose' : kind;

export function toMeasurement(row: MeasurementRow): Measurement {
  return {
    id: row.id,
    healthProfileId: row.healthProfileId,
    sourceDocumentId: row.sourceDocumentId,
    kind: row.kind === 'blood_glucose' ? 'glucose' : 'blood_pressure',
    measuredOn: row.measuredOn,
    measuredTime: row.measuredTime,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    glucoseValue: row.glucoseValue === null ? null : Number(row.glucoseValue),
    glucoseUnit: row.glucoseUnit,
    manualWithoutSource: row.manualWithoutSource,
    createdAt: row.createdAt,
  };
}

export function toMeasurementRow(input: NewMeasurement, familyId: string) {
  return {
    ...input,
    familyId,
    kind: toDbKind(input.kind),
    glucoseValue: input.glucoseValue === null ? null : String(input.glucoseValue),
  };
}
