import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { ObjectReader, ReviewRepository, StoredObject } from './reviewPorts.js';

type ImageOutcome =
  { ok: true; value: StoredObject } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

export async function openDocumentImage(
  repository: ReviewRepository,
  reader: ObjectReader,
  request: { familyId: string; documentId: string },
): Promise<ImageOutcome> {
  const document = await repository.withFamily(request.familyId, (store) =>
    store.findDocument(request.documentId),
  );
  const blocked = consentGate(document?.profileConsentStatus ?? null);
  if (blocked || !document) return { ok: false, code: blocked ?? 'ERR_NOT_FOUND' };
  if (!document.imageKey) return { ok: false, code: 'ERR_NOT_FOUND' };
  const object = await reader.get(document.imageKey);
  if (!object) return { ok: false, code: 'ERR_NOT_FOUND' };
  return { ok: true, value: { body: object.body, contentType: 'image/jpeg' } };
}
