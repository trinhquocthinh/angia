import type { DailyReminder, DailySlot, ProfileSnapshot } from '../domain/DailyReminder.js';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';

export interface ReminderFamilyStore {
  listFamilyAccounts(): Promise<FamilyAccount[]>;
  /** Đợt thuốc chỉ gồm đợt còn hiệu lực ở ngày date. */
  listProfiles(date: string): Promise<ProfileSnapshot[]>;
  /** Ghi bỏ qua dòng trùng (health_profile_id, date, slot); trả số dòng mới. */
  insertReminders(reminders: DailyReminder[]): Promise<number>;
}
export interface ReminderRepository {
  listFamilyIds(): Promise<string[]>;
  withFamily<T>(familyId: string, work: (store: ReminderFamilyStore) => Promise<T>): Promise<T>;
}
export interface FamilyReminderReport {
  familyId: string;
  outcome: 'generated' | 'error';
  created: number;
  existing: number;
  skippedProfiles: { profileId: string; reason: 'no_consent' | 'no_recipients' }[];
  unscheduledSlots: { profileId: string; slot: DailySlot }[];
  reason?: string;
}
export interface GenerateRemindersResult {
  date: string;
  families: FamilyReminderReport[];
  totals: { families: number; created: number; existing: number; failedFamilies: number };
  aborted: boolean;
  listError?: string;
}
