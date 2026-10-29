import type { DocumentDeletionImpact } from '@angia/contracts';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { DeletionRepository } from './deletionPorts.js';

type ImpactOutcome =
  { ok: true; value: DocumentDeletionImpact } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

// SPEC-037: chỉ xem trước, không giữ kết quả cho lần DELETE sau.
export function getDeletionImpact(
  repository: DeletionRepository,
  familyId: string,
  documentId: string,
): Promise<ImpactOutcome> {
  return repository.withFamily(familyId, async (store): Promise<ImpactOutcome> => {
    const document = await store.findDocument(documentId, false);
    const blocked = consentGate(document?.profileConsentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    return { ok: true, value: await store.countImpact(documentId) };
  });
}
