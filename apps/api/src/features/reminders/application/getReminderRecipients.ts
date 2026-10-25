import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import { resolveReminderRecipients } from '../domain/resolveReminderRecipients.js';
import type { ReadRecipientsOutcome, ReminderRecipientRepository } from './recipientPorts.js';

// SPEC-026: người nhận hiện hành của hồ sơ kèm danh sách main có thể chỉ định.
export function getReminderRecipients(
  repository: ReminderRecipientRepository,
  familyId: string,
  profileId: string,
): Promise<ReadRecipientsOutcome> {
  return repository.withFamily(familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    const accounts = await store.listFamilyAccounts();
    const stored = await store.listRecipientIds(profileId);
    return { ok: true, value: resolveReminderRecipients(profileId, accounts, stored) };
  });
}
