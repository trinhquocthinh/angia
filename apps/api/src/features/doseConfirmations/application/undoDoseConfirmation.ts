import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import { doseConfirmationAccess } from '../domain/doseConfirmationAccess.js';
import type { DoseConfirmationActor, DoseConfirmationRepository } from './ports.js';

type Outcome =
  { ok: true } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | 'ERR_VALIDATION' };

// SPEC-046: hủy xóa bản ghi, không lưu lịch sử hủy.
export function undoDoseConfirmation(
  repository: DoseConfirmationRepository,
  actor: DoseConfirmationActor,
  reminderId: string,
  now: () => Date,
): Promise<Outcome> {
  return repository.withFamily(actor.familyId, async (store) => {
    const reminder = await store.lockReminder(reminderId);
    if (!reminder) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (!doseConfirmationAccess(actor, reminder.audience, reminder.confirmation).mayUndo)
      return { ok: false, code: 'ERR_NOT_FOUND' };
    const blocked = consentGate(reminder.consentStatus);
    if (blocked) return { ok: false, code: blocked };
    if (reminder.date !== medicationToday(now)) return { ok: false, code: 'ERR_VALIDATION' };
    await store.remove(reminder);
    return { ok: true };
  });
}
