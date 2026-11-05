import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import { diffPrescriptions } from '../domain/diffPrescriptions.js';
import type {
  PrescriptionChainOutcome,
  PrescriptionChainRepository,
  PrescriptionDetail,
} from './prescriptionChainPorts.js';

export function getPrescriptionDetail(
  repository: PrescriptionChainRepository,
  familyId: string,
  profileId: string,
  prescriptionId: string,
): Promise<PrescriptionChainOutcome<PrescriptionDetail>> {
  return repository.withFamily(familyId, async (store) => {
    const blocked = consentGate(await store.profileConsent(profileId));
    if (blocked) return { ok: false, code: blocked };
    const position = await store.findPosition(profileId, prescriptionId);
    if (!position) return { ok: false, code: 'ERR_NOT_FOUND' };
    const prescription = await store.findPrescription(profileId, prescriptionId);
    if (!prescription) return { ok: false, code: 'ERR_NOT_FOUND' };
    const previous = position.previousId
      ? await store.findPrescription(profileId, position.previousId)
      : null;
    return {
      ok: true,
      value: {
        prescription,
        ...position,
        courses: await store.courses(profileId, prescriptionId),
        diff: previous ? diffPrescriptions(previous, prescription) : null,
      },
    };
  });
}
