import type { SelfReminder } from '@angia/contracts';
import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import { toReminderMedication } from '@src/features/myReminders/application/toReminderMedication.js';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { DoseActor } from '../domain/doseConfirmationAccess.js';
import type { DoseConfirmationRepository } from './ports.js';
import { reminderConfirmationState } from './reminderConfirmationState.js';

type Outcome =
  { ok: true; value: SelfReminder[] } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

// SPEC-046: lời nhắc của một ngày cho `main`, mặc định hôm nay theo giờ Việt Nam.
export function listProfileReminders(
  repository: DoseConfirmationRepository,
  request: { familyId: string; profileId: string; actor: DoseActor; date: string | undefined },
  now: () => Date,
): Promise<Outcome> {
  return repository.withProfileDay(request.familyId, request.profileId, async (store) => {
    const blocked = consentGate(await store.consentStatus());
    if (blocked) return { ok: false, code: blocked };
    const today = medicationToday(now);
    const audience = await store.audience();
    const reminders = await store.reminders(request.date ?? today);
    return {
      ok: true,
      value: reminders.map(({ confirmation, ...reminder }) => ({
        ...reminder,
        medications: reminder.medications.map(toReminderMedication),
        ...reminderConfirmationState(reminder, request.actor, audience, confirmation, today),
      })),
    };
  });
}
