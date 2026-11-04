import { temperatureReadingSchema, type TemperatureReading as TemperatureResponse } from '@angia/contracts';
import type { TemperatureReading } from '../domain/TemperatureReading.js';

export const toTemperatureResponse = (reading: TemperatureReading): TemperatureResponse =>
  temperatureReadingSchema.parse({
    ...reading,
    measuredAt: reading.measuredAt.toISOString(),
    recordedAt: reading.recordedAt.toISOString(),
  });
