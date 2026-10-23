import { planReminderRecipients } from '../domain/planReminderRecipients.js';
import { resolveReminderRecipients } from '../domain/resolveReminderRecipients.js';
import type {
  RecipientsOutcome,
  ReminderRecipientRepository,
  SetReminderRecipientsRequest,
} from './recipientPorts.js';

// SPEC-026/BR-039: thay toàn bộ người nhận của hồ sơ không liên kết trong một giao dịch; sai thì không ghi.
export function setReminderRecipients(
  repository: ReminderRecipientRepository,
  request: SetReminderRecipientsRequest,
): Promise<RecipientsOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    const profile = await store.findProfile(request.profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    const accounts = await store.listFamilyAccounts();
    const plan = planReminderRecipients(request.profileId, accounts, request.recipientAccountIds);
    if (!plan.ok) return plan;
    await store.replaceRecipients(request.profileId, plan.value);
    return { ok: true, value: resolveReminderRecipients(request.profileId, accounts, plan.value) };
  });
}
