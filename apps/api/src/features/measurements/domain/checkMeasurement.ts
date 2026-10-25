import type { MeasurementValues } from './Measurement.js';
import { GLUCOSE_LIMITS, PLAUSIBILITY_LIMITS } from './plausibilityLimits.js';

type OutOfRangeField = 'systolic' | 'diastolic' | 'pulse' | 'glucoseValue';
export type MeasurementCheck =
  | { ok: true }
  | { ok: false; code: 'ERR_BP_INVALID' | 'ERR_GLUCOSE_UNIT_REQUIRED' | 'ERR_VALIDATION' }
  | { ok: false; code: 'ERR_OUT_OF_RANGE_UNCONFIRMED'; fields: OutOfRangeField[] };

const outside = (value: number | null, limit: { min: number; max: number }) =>
  value !== null && (value < limit.min || value > limit.max);

// SPEC-019: ràng buộc cấu trúc (BR-019, BR-020) trước, khoảng khả dĩ (BR-021) sau.
export function checkMeasurement(values: MeasurementValues, confirmOutOfRange: boolean): MeasurementCheck {
  const structural = checkStructure(values);
  if (structural) return structural;
  const fields = outOfRangeFields(values);
  if (fields.length > 0 && !confirmOutOfRange) {
    return { ok: false, code: 'ERR_OUT_OF_RANGE_UNCONFIRMED', fields };
  }
  return { ok: true };
}

function checkStructure(values: MeasurementValues): MeasurementCheck | null {
  if (values.kind === 'blood_pressure') {
    const { systolic, diastolic } = values;
    if (systolic === null || diastolic === null || systolic <= diastolic) {
      return { ok: false, code: 'ERR_BP_INVALID' };
    }
    return null;
  }
  if (values.glucoseValue === null) return { ok: false, code: 'ERR_VALIDATION' };
  if (values.glucoseUnit === null) return { ok: false, code: 'ERR_GLUCOSE_UNIT_REQUIRED' };
  return null;
}

function outOfRangeFields(values: MeasurementValues): OutOfRangeField[] {
  if (values.kind === 'glucose') {
    const limit = GLUCOSE_LIMITS[values.glucoseUnit ?? 'mmol/L'];
    return outside(values.glucoseValue, limit) ? ['glucoseValue'] : [];
  }
  return (['systolic', 'diastolic', 'pulse'] as const).filter((field) =>
    outside(values[field], PLAUSIBILITY_LIMITS[field]),
  );
}
