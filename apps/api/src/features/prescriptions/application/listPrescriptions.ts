import type { PrescriptionListItem } from '@angia/contracts';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { PrescriptionChainOutcome, PrescriptionChainRepository } from './prescriptionChainPorts.js';

export function listPrescriptions(
  repository: PrescriptionChainRepository,
  familyId: string,
  profileId: string,
): Promise<PrescriptionChainOutcome<PrescriptionListItem[]>> {
  return repository.withFamily(familyId, async (store) => {
    const blocked = consentGate(await store.profileConsent(profileId));
    if (blocked) return { ok: false, code: blocked };
    return { ok: true, value: await store.list(profileId) };
  });
}
