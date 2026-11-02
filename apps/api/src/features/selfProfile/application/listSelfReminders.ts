import type { SelfReminder } from '@angia/contracts';
import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import { toReminderMedication } from '@src/features/myReminders/application/toReminderMedication.js';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { SelfProfileScope } from './ports.js';

type Outcome =
  { ok: true; value: SelfReminder[] } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

// SPEC-042: lời nhắc của một ngày, mặc định hôm nay theo giờ Việt Nam.
export function listSelfReminders(
  scope: SelfProfileScope,
  familyId: string,
  date: string | undefined,
  now: () => Date,
): Promise<Outcome> {
  return scope.withFamily(familyId, async (store) => {
    const blocked = consentGate((await store.profile())?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    const reminders = await store.reminders(date ?? medicationToday(now));
    return {
      ok: true,
      value: reminders.map((r) => ({ ...r, medications: r.medications.map(toReminderMedication) })),
    };
  });
}
