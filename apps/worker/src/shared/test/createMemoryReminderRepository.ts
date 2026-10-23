import type { ReminderRepository } from '@src/features/reminderGeneration/application/ports.js';
import type {
  DailyReminder,
  FamilyAccount,
  ProfileSnapshot,
} from '@src/features/reminderGeneration/domain/DailyReminder.js';

interface FamilyData {
  accounts: FamilyAccount[];
  profiles: ProfileSnapshot[];
}
interface Faults {
  failingFamilyId?: string;
  listFails?: boolean;
}

// Repository bộ nhớ mô phỏng khóa duy nhất (health_profile_id, date, slot) của bảng reminders.
export function createMemoryReminderRepository(families: Record<string, FamilyData>, faults: Faults = {}) {
  const rows = new Map<string, DailyReminder>();
  const repository: ReminderRepository = {
    listFamilyIds: async () => {
      if (faults.listFails) throw Object.assign(new Error('down'), { code: 'ECONNREFUSED' });
      return Object.keys(families);
    },
    withFamily: async (familyId, work) => {
      if (familyId === faults.failingFamilyId) throw Object.assign(new Error('denied'), { code: '42501' });
      const data = families[familyId] ?? { accounts: [], profiles: [] };
      return work({
        listFamilyAccounts: async () => data.accounts,
        listProfiles: async () => data.profiles,
        insertReminders: async (reminders) => {
          let inserted = 0;
          for (const reminder of reminders) {
            const key = `${reminder.profileId}|${reminder.date}|${reminder.slot}`;
            if (rows.has(key)) continue;
            rows.set(key, reminder);
            inserted += 1;
          }
          return inserted;
        },
      });
    },
  };
  return Object.assign(repository, { stored: () => [...rows.values()] });
}
