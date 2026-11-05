import { z } from 'zod';
import { medicationCourseSchema } from '../medications/selfReportedCourseSchemas.js';
import { prescriptionSchema } from './prescriptionSchema.js';
import { prescriptionDiffSchema } from './prescriptionDiffSchema.js';

export const prescriptionListItemSchema = z
  .object({
    id: z.uuid(),
    issuedDate: z.iso.date(),
    facility: z.string().nullable(),
    diagnosis: z.string().nullable(),
    itemCount: z.number().int().nonnegative(),
    revisitDate: z.iso.date().nullable(),
    origin: z.enum(['document', 'manual']),
  })
  .meta({ id: 'PrescriptionListItem' });

export const prescriptionDetailSchema = z
  .object({
    prescription: prescriptionSchema,
    previousId: z.uuid().nullable(),
    nextId: z.uuid().nullable(),
    courses: z.array(medicationCourseSchema),
    diff: prescriptionDiffSchema.nullable(),
  })
  .meta({ id: 'PrescriptionDetail' });
export type PrescriptionListItem = z.infer<typeof prescriptionListItemSchema>;
export type PrescriptionDetail = z.infer<typeof prescriptionDetailSchema>;
