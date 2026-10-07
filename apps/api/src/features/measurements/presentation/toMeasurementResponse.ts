import type { Measurement as MeasurementResponse } from '@angia/contracts';
import type { Measurement } from '../domain/Measurement.js';

export function toMeasurementResponse(measurement: Measurement): MeasurementResponse {
  return { ...measurement, createdAt: measurement.createdAt.toISOString() };
}
