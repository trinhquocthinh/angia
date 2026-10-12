import { z } from 'zod';
import { doseSlotSchema } from '../prescriptions/prescriptionSchema.js';

// Thiếu liều/buổi được chuyển tới Application để trả ERR_DOSE_INFO_MISSING (TC-050).
// Không cho client gửi source/status/endDate/prescriptionItemId.
export const createSelfReportedCourseRequestSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(200),
    strength: z.string().trim().max(100).nullable().optional(),
    quantityPerDose: z.number().positive().max(1000).nullable().optional(),
    doseUnit: z.string().trim().min(1).max(50),
    slots: z
      .array(doseSlotSchema)
      .max(4)
      .refine((slots) => new Set(slots).size === slots.length, 'Buổi dùng bị lặp')
      .optional(),
    startDate: z.iso.date(),
    resolution: z.enum(['replace', 'parallel']).optional(),
    expectedConflictCourseIds: z
      .array(z.uuid())
      .refine((ids) => new Set(ids).size === ids.length, 'Đợt thuốc bị lặp')
      .optional(),
  })
  .meta({ id: 'CreateSelfReportedCourseRequest' });
export type CreateSelfReportedCourseRequest = z.infer<typeof createSelfReportedCourseRequestSchema>;

export const medicationCourseSchema = z
  .object({
    id: z.uuid(),
    healthProfileId: z.uuid(),
    prescriptionItemId: z.uuid().nullable(),
    source: z.enum(['prescription', 'self_reported']),
    name: z.string(),
    strength: z.string().nullable(),
    quantityPerDose: z.number().positive().nullable(),
    doseUnit: z.string().nullable(),
    slots: z.array(doseSlotSchema).min(1),
    startDate: z.iso.date(),
    endDate: z.iso.date().nullable(),
    status: z.enum(['active', 'ended', 'stopped', 'replaced']),
  })
  .meta({ id: 'MedicationCourse' });
export type MedicationCourse = z.infer<typeof medicationCourseSchema>;
