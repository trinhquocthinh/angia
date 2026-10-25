import { z } from 'zod';
import { medicationCourseSchema } from './selfReportedCourseSchemas.js';
// SPEC-018 tại hôm nay (Việt Nam): đợt kèm ngày kê của đơn nguồn để hiển thị "Đơn dd/mm/yyyy".
export const currentMedicationCourseSchema = medicationCourseSchema
  .extend({ prescriptionIssuedDate: z.iso.date().nullable() })
  .meta({ id: 'CurrentMedicationCourse' });
export type CurrentMedicationCourse = z.infer<typeof currentMedicationCourseSchema>;
export const currentMedicationsSchema = z
  .object({
    today: z.iso.date(),
    courses: z.array(currentMedicationCourseSchema),
  })
  .meta({ id: 'CurrentMedications' });
export type CurrentMedications = z.infer<typeof currentMedicationsSchema>;
