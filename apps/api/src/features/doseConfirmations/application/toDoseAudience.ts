import { resolveReminderRecipients } from '@src/features/reminders/domain/resolveReminderRecipients.js';
import type { FamilyAccount } from '@src/features/reminders/domain/ReminderRecipient.js';
import type { DoseAudience } from '../domain/doseConfirmationAccess.js';

export function toDoseAudience(
  profileId: string,
  familyAccounts: FamilyAccount[],
  assignedAccountIds: string[],
): DoseAudience {
  const { mode, recipients } = resolveReminderRecipients(profileId, familyAccounts, assignedAccountIds);
  return { linked: mode === 'linked', recipientIds: recipients.map((r) => r.accountId) };
}
