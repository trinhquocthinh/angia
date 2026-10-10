import { z } from 'zod';
import { doseSlotSchema } from '../prescriptions/prescriptionSchema.js';

// Bản đối soát người dùng gửi lên. Trường ngày được phép null để API trả ERR_DOCUMENT_DATE_REQUIRED;
// liều/buổi/số ngày được phép trống để API trả ERR_DOSE_INFO_MISSING chỉ đúng dòng (SPEC-010, BR-025).
const reading = z.number().int().positive().max(9999).nullable();
const optionalText = (max: number) => z.string().trim().max(max).nullable();
const requiredText = (max: number) => z.string().trim().min(1).max(max);

export const deviceReadingApprovalSchema = z.object({
  type: z.literal('device_reading'),
  measuredAt: z.iso.date().nullable(),
  measuredTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  kind: z.enum(['blood_pressure', 'glucose']),
  systolic: reading,
  diastolic: reading,
  pulse: reading,
  glucoseValue: z.number().positive().max(9999).nullable(),
  glucoseUnit: z.enum(['mmol/L', 'mg/dL']).nullable(),
});

const prescriptionItemApprovalSchema = z.object({
  name: requiredText(200),
  strength: optionalText(100),
  quantityPerDose: z.number().positive().max(1000).nullable(),
  doseUnit: optionalText(50),
  slots: z
    .array(doseSlotSchema)
    .max(4)
    .refine((slots) => new Set(slots).size === slots.length, 'Buổi dùng bị lặp'),
  durationDays: z.number().int().positive().max(3650).nullable(),
  longTerm: z.boolean(),
  note: optionalText(500),
  totalQuantity: z.number().positive().max(100000).nullable(),
});

export const prescriptionApprovalSchema = z.object({
  type: z.literal('prescription'),
  issuedDate: z.iso.date().nullable(),
  facility: optionalText(200),
  diagnosis: optionalText(500),
  items: z.array(prescriptionItemApprovalSchema).min(1).max(50),
});

export const labResultApprovalSchema = z.object({
  type: z.literal('lab_result'),
  resultDate: z.iso.date().nullable(),
  facility: optionalText(200),
  items: z
    .array(
      z.object({
        testName: requiredText(200),
        value: requiredText(100),
        unit: optionalText(50),
        referenceRange: optionalText(100),
      }),
    )
    .min(1)
    .max(100),
});
