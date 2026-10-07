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

export const measurementListQuerySchema = z.object({
  kind: z.enum(['blood_pressure', 'glucose']).optional(),
});
