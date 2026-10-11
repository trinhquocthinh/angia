import type { ReviewStore } from '@src/features/documents/application/reviewPorts.js';
import type { MedicationCourse } from '@src/features/medications/domain/MedicationCourse.js';
import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';

// Test double chỉ ghi thay thế vào vùng tạm; lỗi ở bất kỳ bước nào không được đổi bản đã commit.
export function createMemoryMedicationStore(courses: MedicationCourse[], prescriptions: Prescription[]) {
  const updates = new Map<string, MedicationCourse>();
  const store: Pick<
    ReviewStore,
    'lockMedicationProfile' | 'findMedicationCourses' | 'replaceMedicationCourses'
  > = {
    lockMedicationProfile: async () => undefined,
    findMedicationCourses: async (profileId) =>
      courses
        .filter((c) => c.healthProfileId === profileId)
        .map((c) => ({
          ...c,
          strength:
            c.strength ??
            prescriptions.flatMap((p) => p.items).find((i) => i.id === c.prescriptionItemId)?.strength ??
            null,
        })),
    replaceMedicationCourses: async (profileId, ids, endDate) => {
      for (const course of courses.filter((c) => c.healthProfileId === profileId && ids.includes(c.id)))
        updates.set(course.id, { ...course, status: 'replaced', endDate });
    },
  };
  return {
    store,
    commit: () => {
      for (const [id, updated] of updates) courses[courses.findIndex((c) => c.id === id)] = updated;
    },
  };
}
