import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import { isValidRevisitDate } from '../domain/isValidRevisitDate.js';
import type { RevisitOutcome, RevisitRepository, SetRevisitDateRequest } from './revisitPorts.js';

export function setRevisitDate(
  repository: RevisitRepository,
  request: SetRevisitDateRequest,
  now: () => Date,
): Promise<RevisitOutcome<{ revisitDate: string | null }>> {
  const { familyId, profileId, prescriptionId, revisitDate } = request;
  return repository.withFamily(familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    await store.lockProfile(profileId);
    const prescription = await store.findPrescription(profileId, prescriptionId);
    if (!prescription) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (!isValidRevisitDate(prescription.issuedDate, revisitDate))
      return { ok: false, code: 'ERR_VALIDATION' };
    await store.updateDate(prescriptionId, revisitDate);
    if (prescription.revisitDate && prescription.revisitDate !== revisitDate)
      await store.cleanReminders(profileId, prescription.revisitDate);
    if (revisitDate) await store.ensureReminder(profileId, revisitDate, medicationToday(now));
    return { ok: true, value: { revisitDate } };
  });
}
