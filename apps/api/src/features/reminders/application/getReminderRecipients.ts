import { resolveReminderRecipients } from '../domain/resolveReminderRecipients.js';
import type { ReadRecipientsOutcome, ReminderRecipientRepository } from './recipientPorts.js';

// SPEC-026: người nhận hiện hành của hồ sơ kèm danh sách main có thể chỉ định.
export function getReminderRecipients(
  repository: ReminderRecipientRepository,
  familyId: string,
  profileId: string,
): Promise<ReadRecipientsOutcome> {
  return repository.withFamily(familyId, async (store) => {
    if (!(await store.findProfile(profileId))) return { ok: false, code: 'ERR_NOT_FOUND' };
    const accounts = await store.listFamilyAccounts();
    const stored = await store.listRecipientIds(profileId);
    return { ok: true, value: resolveReminderRecipients(profileId, accounts, stored) };
  });
}
