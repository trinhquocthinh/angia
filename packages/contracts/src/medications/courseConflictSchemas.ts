import { z } from 'zod';
import { doseSlotSchema } from '../prescriptions/prescriptionSchema.js';

export const courseConflictSchema = z
  .object({
    itemIndexes: z.array(z.number().int().min(0).max(49)).min(1),
    nameNormalized: z.string().min(1),
    courses: z.array(
      z.object({
        id: z.uuid(),
        name: z.string(),
        strength: z.string().nullable(),
        quantityPerDose: z.number().positive().nullable(),
        doseUnit: z.string().nullable(),
        slots: z.array(doseSlotSchema).min(1),
        startDate: z.iso.date(),
        endDate: z.iso.date().nullable(),
      }),
    ),
  })
  .meta({ id: 'MedicationCourseConflict' });
export type CourseConflict = z.infer<typeof courseConflictSchema>;

export const courseConflictErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.literal('ERR_COURSE_CONFLICT_UNRESOLVED'),
      message: z.string(),
      details: z.object({ conflicts: z.array(courseConflictSchema).min(1) }),
    }),
  })
  .meta({ id: 'CourseConflictErrorResponse' });
