import { currentMedicationCourseSchema } from '@angia/contracts';
import type { CurrentMedicationCourse } from '../application/managementPorts.js';

export function toCurrentMedicationsResponse(list: { today: string; courses: CurrentMedicationCourse[] }) {
  return {
    today: list.today,
    courses: list.courses.map((course) =>
      currentMedicationCourseSchema.parse({
        ...course,
        strength: course.strength ?? null,
        lastDoseAt: course.lastDoseAt?.toISOString() ?? null,
      }),
    ),
  };
}
