import { toAdherencePeriodResponse } from '@src/features/adherence/presentation/toAdherencePeriodResponse.js';
import type { MeasurementSeries } from '../application/getMeasurementSeries.js';
import type { GlucoseUnit } from '../domain/Measurement.js';
import { toSeriesPointResponse } from './toSeriesPointResponse.js';

export function toSeriesResponse(series: MeasurementSeries, displayGlucoseUnit: GlucoseUnit) {
  return {
    points: series.points.map((point) => toSeriesPointResponse(point, displayGlucoseUnit)),
    weeks: series.weeks,
    periods: series.periods.map(toAdherencePeriodResponse),
  };
}
