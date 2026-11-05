import type {
  MyRevisitReminderActor,
  MyRevisitReminderOutcome,
  MyRevisitReminderRepository,
} from './ports.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_FOUND: MyRevisitReminderOutcome = { ok: false, code: 'ERR_NOT_FOUND' };

export async function getMyRevisitReminder(
  repository: MyRevisitReminderRepository,
  actor: MyRevisitReminderActor,
  reminderId: string,
): Promise<MyRevisitReminderOutcome> {
  if (!UUID_PATTERN.test(reminderId)) return NOT_FOUND;
  const loaded = await repository.load(actor.familyId, reminderId);
  if (!loaded?.consentConfirmed) return NOT_FOUND;
  const account = loaded.familyAccounts.find((a) => a.id === actor.accountId);
  if (!account || (account.role !== 'main' && account.healthProfileId !== loaded.reminder.profileId))
    return NOT_FOUND;
  return { ok: true, value: { ...loaded.reminder, canOpenSummary: account.role === 'main' } };
}
