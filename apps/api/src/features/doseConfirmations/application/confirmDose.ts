import type { DoseConfirmation } from '@angia/contracts';
import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import { doseConfirmationAccess } from '../domain/doseConfirmationAccess.js';
import type { DoseConfirmationActor, DoseConfirmationRepository } from './ports.js';

type Outcome =
  | { ok: true; value: DoseConfirmation }
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | 'ERR_VALIDATION' };
const MAX_NAME_LENGTH = 60;

// SPEC-046: quyền kiểm trước để người ngoài không phân biệt được với lời nhắc không tồn tại.
// Đã có bản ghi thì trả bản đó, không ghi đè người xác nhận.
export function confirmDose(
  repository: DoseConfirmationRepository,
  actor: DoseConfirmationActor,
  reminderId: string,
  now: () => Date,
): Promise<Outcome> {
  return repository.withFamily(actor.familyId, async (store) => {
    const reminder = await store.lockReminder(reminderId);
    if (!reminder) return { ok: false, code: 'ERR_NOT_FOUND' };
    const { confirmation } = reminder;
    if (!doseConfirmationAccess(actor, reminder.audience, confirmation).mayConfirm)
      return { ok: false, code: 'ERR_NOT_FOUND' };
    const blocked = consentGate(reminder.consentStatus);
    if (blocked) return { ok: false, code: blocked };
    if (reminder.date !== medicationToday(now)) return { ok: false, code: 'ERR_VALIDATION' };
    const stored =
      confirmation ??
      (await store.insert(reminder, actor.accountId, actor.displayName.slice(0, MAX_NAME_LENGTH), now()));
    return { ok: true, value: { ...stored, reminderId: reminder.id } };
  });
}
