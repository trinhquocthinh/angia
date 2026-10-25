import type { MyReminder } from '@angia/contracts';
import type { FamilyAccount } from '@src/features/reminders/domain/ReminderRecipient.js';

// Thuốc như ảnh chụp trong reminders.medications; courseId bị bỏ khi trả ra ngoài.
export type StoredReminderMedication = MyReminder['medications'][number] & { courseId?: string };

interface LoadedMyReminder {
  reminder: Omit<MyReminder, 'medications'> & {
    medications: StoredReminderMedication[];
    profileId: string;
    consentConfirmed: boolean;
  };
  /** Tài khoản đang thuộc gia đình (có vai trò). */
  familyAccounts: FamilyAccount[];
  /** Người nhận đã lưu ở reminder_recipients cho hồ sơ, chưa lọc theo vai trò hiện hành. */
  assignedAccountIds: string[];
}

export interface MyReminderRepository {
  /** Đọc trong withFamilyScope; null khi lời nhắc không thuộc gia đình. */
  load(familyId: string, reminderId: string): Promise<LoadedMyReminder | null>;
}

export interface MyReminderActor {
  familyId: string;
  accountId: string;
}

export type MyReminderOutcome = { ok: true; value: MyReminder } | { ok: false; code: 'ERR_NOT_FOUND' };
