import { z } from 'zod';
import { medicationCourseSchema } from './selfReportedCourseSchemas.js';

const unique = (values: readonly string[]) => new Set(values).size === values.length;

// SPEC-029: chỉ ngày bắt đầu, dòng chọn và số ngày/dài hạn; tên, liều, buổi luôn chép từ dòng gốc.
// Thiếu số ngày được chuyển tới Application để trả ERR_DOSE_INFO_MISSING chỉ rõ dòng.
export const reusePrescriptionRequestSchema = z
  .strictObject({
    startDate: z.iso.date(),
    items: z
      .array(
        z.strictObject({
          prescriptionItemId: z.uuid(),
          durationDays: z.number().int().min(1).max(3650).nullable(),
          longTerm: z.boolean(),
          resolution: z.enum(['replace', 'parallel']).optional(),
          expectedConflictCourseIds: z.array(z.uuid()).refine(unique, 'Đợt thuốc bị lặp').optional(),
        }),
      )
      .min(1)
      .max(50)
      .refine((items) => unique(items.map((item) => item.prescriptionItemId)), 'Dòng thuốc bị lặp'),
  })
  .meta({ id: 'ReusePrescriptionRequest' });
export type ReusePrescriptionRequest = z.infer<typeof reusePrescriptionRequestSchema>;

export const reusePrescriptionResponseSchema = z
  .object({ courses: z.array(medicationCourseSchema) })
  .meta({ id: 'ReusePrescriptionResponse' });
export type ReusePrescriptionResponse = z.infer<typeof reusePrescriptionResponseSchema>;
