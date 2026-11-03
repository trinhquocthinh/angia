import type { SelfReminder } from '@angia/contracts';
import { reminderConfirmationState } from '@src/features/doseConfirmations/application/reminderConfirmationState.js';
import type { DoseActor } from '@src/features/doseConfirmations/domain/doseConfirmationAccess.js';
import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import { toReminderMedication } from '@src/features/myReminders/application/toReminderMedication.js';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { SelfProfileScope } from './ports.js';

type Outcome =
  { ok: true; value: SelfReminder[] } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

// SPEC-042, SPEC-046: lời nhắc của một ngày, mặc định hôm nay theo giờ Việt Nam. Phiên chính là tài khoản liên kết.
export function listSelfReminders(
  scope: SelfProfileScope,
  familyId: string,
  actor: DoseActor,
  date: string | undefined,
  now: () => Date,
): Promise<Outcome> {
  return scope.withFamily(familyId, async (store) => {
    const blocked = consentGate((await store.profile())?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    const today = medicationToday(now);
    const reminders = await store.reminders(date ?? today);
    const audience = { linked: true, recipientIds: [actor.accountId] };
    return {
      ok: true,
      value: reminders.map(({ confirmation, ...r }) => ({
        ...r,
        medications: r.medications.map(toReminderMedication),
        ...reminderConfirmationState(r, actor, audience, confirmation, today),
      })),
    };
  });
}
