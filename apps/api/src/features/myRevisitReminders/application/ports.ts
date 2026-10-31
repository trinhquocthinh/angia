import type { MyRevisitReminder } from '@angia/contracts';
import type { FamilyAccount } from '@src/features/reminders/domain/ReminderRecipient.js';

export interface MyRevisitReminderRepository {
  /** Toàn bộ truy vấn trong một withFamilyScope; không lưu tập người nhận. */
  load(
    familyId: string,
    reminderId: string,
  ): Promise<{
    reminder: Omit<MyRevisitReminder, 'canOpenSummary'>;
    consentConfirmed: boolean;
    familyAccounts: FamilyAccount[];
  } | null>;
}
export interface MyRevisitReminderActor {
  familyId: string;
  accountId: string;
}
export type MyRevisitReminderOutcome =
  { ok: true; value: MyRevisitReminder } | { ok: false; code: 'ERR_NOT_FOUND' };
