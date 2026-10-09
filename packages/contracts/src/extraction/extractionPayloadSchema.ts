import { z } from 'zod';

// Hợp đồng payload trích xuất SDD §2.1: worker kiểm phản hồi Vision-LLM, form duyệt (SPEC-010) dùng lại.
// Trường vắng mặt trên chứng từ phải là `null`, không được bỏ khóa (BR-016, BR-025).
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();
const text = z.string().nullable();

const prescriptionItem = z.object({
  name: z.string(),
  strength: text,
  quantityPerDose: z.number().positive().nullable(),
  doseUnit: text,
  slots: z.array(z.enum(['morning', 'noon', 'afternoon', 'evening'])),
  durationDays: z.number().int().positive().nullable(),
  longTerm: z.boolean(),
  note: text,
});

const labItem = z.object({
  testName: z.string(),
  value: text,
  unit: text,
  referenceRange: text,
});

export const extractionPayloadSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('prescription'),
    issuedDate: isoDate,
    facility: text,
    // Thêm sau E2 (E3-S3-T1): bản trích xuất cũ không có khóa này nên mặc định null.
    diagnosis: text.default(null),
    items: z.array(prescriptionItem),
  }),
  z.object({
    type: z.literal('lab_result'),
    resultDate: isoDate,
    facility: text,
    items: z.array(labItem),
  }),
  z.object({
    type: z.literal('device_reading'),
    measuredAt: isoDate,
    measuredTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable(),
    kind: z.enum(['blood_pressure', 'glucose']),
    systolic: z.number().nullable(),
    diastolic: z.number().nullable(),
    pulse: z.number().nullable(),
    glucoseValue: z.number().nullable(),
    glucoseUnit: z.enum(['mmol/L', 'mg/dL']).nullable(),
  }),
]);

export type ExtractionPayload = z.infer<typeof extractionPayloadSchema>;
