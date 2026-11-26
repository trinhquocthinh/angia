import { reminderSeedId } from './reminderSeedId.js';

export function createReminderSeedData(profileId: string) {
  return {
    slots: [
      { slot: 'morning' as const, timeOfDay: '07:30' },
      { slot: 'noon' as const, timeOfDay: '12:00' },
      { slot: 'afternoon' as const, timeOfDay: '17:00' },
      { slot: 'evening' as const, timeOfDay: '20:00' },
    ],
    medications: [
      {
        courseId: reminderSeedId(profileId, 'course-a'),
        name: 'Vitamin mẫu A',
        strength: '500 mg',
        quantityPerDose: '1',
        doseUnit: 'viên',
      },
      {
        courseId: reminderSeedId(profileId, 'course-b'),
        name: 'Vitamin mẫu B',
        strength: null,
        quantityPerDose: '2',
        doseUnit: 'viên',
      },
    ],
  };
}
