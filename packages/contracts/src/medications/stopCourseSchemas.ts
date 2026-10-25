import { z } from 'zod';
import { medicationCourseSchema } from './selfReportedCourseSchemas.js';
export const stopCourseRequestSchema = z
  .strictObject({ stopDate: z.iso.date() })
  .meta({ id: 'StopCourseRequest' });
export type StopCourseRequest = z.infer<typeof stopCourseRequestSchema>;
export const stoppableCoursesSchema = z
  .object({
    today: z.iso.date(),
    courses: z.array(medicationCourseSchema),
  })
  .meta({ id: 'StoppableCourses' });
export type StoppableCourses = z.infer<typeof stoppableCoursesSchema>;
