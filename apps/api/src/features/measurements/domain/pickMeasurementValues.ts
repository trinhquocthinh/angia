import type { MeasurementValues } from './Measurement.js';

// Chỉ giữ trường thuộc loại chỉ số; trường thừa từ bản trích xuất không được lưu kèm.
export function pickMeasurementValues(values: MeasurementValues): MeasurementValues {
  const empty = { systolic: null, diastolic: null, pulse: null, glucoseValue: null, glucoseUnit: null };
  if (values.kind === 'blood_pressure') {
    const { systolic, diastolic, pulse } = values;
    return { ...empty, kind: 'blood_pressure', systolic, diastolic, pulse };
  }
  return { ...empty, kind: 'glucose', glucoseValue: values.glucoseValue, glucoseUnit: values.glucoseUnit };
}
