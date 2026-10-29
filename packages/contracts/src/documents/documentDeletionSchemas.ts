import { z } from 'zod';

export const deleteDocumentRequestSchema = z
  .object({ confirm: z.literal('XÓA') })
  .meta({ id: 'DeleteDocumentRequest' });

export const documentDeletionImpactSchema = z
  .object({
    prescriptions: z.number().int().nonnegative(),
    prescriptionItems: z.number().int().nonnegative(),
    labResults: z.number().int().nonnegative(),
    measurements: z.number().int().nonnegative(),
    medicationCourses: z.number().int().nonnegative(),
    activeMedicationCourses: z.number().int().nonnegative(),
  })
  .meta({ id: 'DocumentDeletionImpact' });

export type DeleteDocumentRequest = z.infer<typeof deleteDocumentRequestSchema>;
export type DocumentDeletionImpact = z.infer<typeof documentDeletionImpactSchema>;
