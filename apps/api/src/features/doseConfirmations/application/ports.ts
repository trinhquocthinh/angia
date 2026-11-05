import type { DoseConfirmation, SelfReminder } from '@angia/contracts';
import type { StoredReminderMedication } from '@src/features/myReminders/application/ports.js';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { DoseActor, DoseAudience } from '../domain/doseConfirmationAccess.js';

// Khóa theo (hồ sơ, ngày, buổi), không theo reminder_id: reminderId lấy từ lời nhắc đang hiển thị.
export type StoredDoseConfirmation = Omit<DoseConfirmation, 'reminderId'>;

export type StoredDayReminder = Pick<SelfReminder, 'id' | 'date' | 'slot' | 'scheduledAt'> & {
  medications: StoredReminderMedication[];
  confirmation: StoredDoseConfirmation | null;
};

export interface LockedReminder {
  id: string;
  profileId: string;
  date: string;
  slot: SelfReminder['slot'];
  consentStatus: ConsentStatus;
  audience: DoseAudience;
  confirmation: StoredDoseConfirmation | null;
}

interface DoseConfirmationStore {
  /** Khóa hồ sơ rồi lời nhắc để tuần tự hóa với rút đồng thuận và các lần bấm khác; null = không thuộc gia đình. */
  lockReminder(reminderId: string): Promise<LockedReminder | null>;
  insert(
    reminder: LockedReminder,
    accountId: string,
    displayName: string,
    confirmedAt: Date,
  ): Promise<StoredDoseConfirmation>;
  remove(reminder: LockedReminder): Promise<void>;
}

interface ProfileDayStore {
  /** null = hồ sơ không thuộc gia đình. */
  consentStatus(): Promise<ConsentStatus | null>;
  audience(): Promise<DoseAudience>;
  reminders(date: string): Promise<StoredDayReminder[]>;
}

export interface DoseConfirmationRepository {
  withFamily<T>(familyId: string, work: (store: DoseConfirmationStore) => Promise<T>): Promise<T>;
  withProfileDay<T>(
    familyId: string,
    profileId: string,
    work: (store: ProfileDayStore) => Promise<T>,
  ): Promise<T>;
}

export interface DoseConfirmationActor extends DoseActor {
  familyId: string;
  displayName: string;
}
