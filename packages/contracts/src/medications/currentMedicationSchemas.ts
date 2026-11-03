import { z } from 'zod';
import { doseIntervalSchema } from './asNeededDoseSchemas.js';
import { medicationCourseSchema } from './selfReportedCourseSchemas.js';
// SPEC-018 tại hôm nay (Việt Nam): đợt kèm ngày kê của đơn nguồn để hiển thị "Đơn dd/mm/yyyy".
// Thẻ "Khi cần" (SPEC-047): liều gần nhất và khoảng cách có nguồn; null với đợt khác.
export const currentMedicationCourseSchema = medicationCourseSchema
  .extend({
    prescriptionIssuedDate: z.iso.date().nullable(),
    lastDoseAt: z.iso.datetime().nullable(),
    interval: doseIntervalSchema.nullable(),
  })
  .meta({ id: 'CurrentMedicationCourse' });
export type CurrentMedicationCourse = z.infer<typeof currentMedicationCourseSchema>;
export const currentMedicationsSchema = z
  .object({
    today: z.iso.date(),
    courses: z.array(currentMedicationCourseSchema),
  })
  .meta({ id: 'CurrentMedications' });
export type CurrentMedications = z.infer<typeof currentMedicationsSchema>;
