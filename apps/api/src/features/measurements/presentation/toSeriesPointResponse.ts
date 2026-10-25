import type { MeasurementSeriesPoint } from '@angia/contracts';
import { convertGlucose } from '../domain/convertGlucose.js';
import type { GlucoseUnit, Measurement } from '../domain/Measurement.js';
import { toMeasurementResponse } from './toMeasurementResponse.js';

// SPEC-020: quy đổi đơn vị hiển thị tại presenter; giá trị/đơn vị gốc vẫn trả kèm (BR-020).
export function toSeriesPointResponse(
  measurement: Measurement,
  displayUnit: GlucoseUnit,
): MeasurementSeriesPoint {
  const { glucoseValue, glucoseUnit } = measurement;
  const hasGlucose = glucoseValue !== null && glucoseUnit !== null;
  return {
    ...toMeasurementResponse(measurement),
    displayGlucoseValue: hasGlucose ? convertGlucose(glucoseValue, glucoseUnit, displayUnit) : null,
    displayGlucoseUnit: hasGlucose ? displayUnit : null,
  };
}
