import { z } from 'zod';
import { measurementSchema } from './measurementSchema.js';

const glucoseUnit = z.enum(['mmol/L', 'mg/dL']);
const MAX_SERIES_DAYS = 366;
const daySpan = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;

// SPEC-020: cửa sổ [from, to] tính cả hai đầu, from ≤ to và tối đa 366 ngày (F09a) → sai → ERR_VALIDATION.
export const measurementSeriesQuerySchema = z
  .object({
    kind: z.enum(['blood_pressure', 'glucose']),
    from: z.iso.date(),
    to: z.iso.date(),
    displayGlucoseUnit: glucoseUnit.default('mmol/L'),
  })
  .refine(({ from, to }) => from <= to && daySpan(from, to) <= MAX_SERIES_DAYS, {
    message: `Khoảng thời gian phải từ 1 đến ${MAX_SERIES_DAYS} ngày`,
    path: ['to'],
  });

// BR-020: giữ glucoseValue/glucoseUnit gốc; display* là giá trị quy đổi để vẽ (null với huyết áp).
export const measurementSeriesPointSchema = measurementSchema
  .extend({ displayGlucoseValue: z.number().nullable(), displayGlucoseUnit: glucoseUnit.nullable() })
  .meta({ id: 'MeasurementSeriesPoint' });

export const measurementSeriesSchema = z
  .object({
    points: z.array(measurementSeriesPointSchema),
    weeks: z.array(z.object({ weekStart: z.iso.date(), hasMeasurement: z.boolean() })),
  })
  .meta({ id: 'MeasurementSeries' });
export type MeasurementSeries = z.infer<typeof measurementSeriesSchema>;
export type MeasurementSeriesPoint = z.infer<typeof measurementSeriesPointSchema>;
