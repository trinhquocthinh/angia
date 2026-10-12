import { z } from 'zod';

// Số đo đã duyệt; đường huyết giữ nguyên đơn vị gốc (BR-020), quy đổi hiển thị thuộc SPEC-020.
export const measurementSchema = z
  .object({
    id: z.uuid(),
    healthProfileId: z.uuid(),
    sourceDocumentId: z.uuid().nullable(),
    kind: z.enum(['blood_pressure', 'glucose']),
    measuredOn: z.iso.date(),
    measuredTime: z.string().nullable(),
    systolic: z.number().int().nullable(),
    diastolic: z.number().int().nullable(),
    pulse: z.number().int().nullable(),
    glucoseValue: z.number().nullable(),
    glucoseUnit: z.enum(['mmol/L', 'mg/dL']).nullable(),
    manualWithoutSource: z.boolean(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'Measurement' });
export type Measurement = z.infer<typeof measurementSchema>;

// F09a: danh sách số đo phân trang cursor; cursor là id số đo cuối của trang trước.
export const measurementListQuerySchema = z.object({
  kind: z.enum(['blood_pressure', 'glucose']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.uuid().optional(),
});

export const measurementPageSchema = z
  .object({ items: z.array(measurementSchema), nextCursor: z.uuid().nullable() })
  .meta({ id: 'MeasurementPage' });
export type MeasurementPage = z.infer<typeof measurementPageSchema>;
