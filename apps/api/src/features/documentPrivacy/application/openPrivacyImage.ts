import { isPrivacyImageKey } from '../domain/isPrivacyImageKey.js';
import type { StoredObject, ObjectReader } from '../../documents/application/reviewPorts.js';
import type { PrivacyRepository } from './ports.js';
export async function openPrivacyImage(
  repo: PrivacyRepository,
  reader: ObjectReader,
  input: { familyId: string; documentId: string; draftId: string },
): Promise<{ ok: true; value: StoredObject } | { ok: false; code: 'ERR_NOT_FOUND' }> {
  const doc = await repo.withFamily(input.familyId, (store) => store.findDocument(input.documentId));
  if (
    !doc ||
    doc.privacyDraftId !== input.draftId ||
    doc.privacyDraftStatus !== 'ready' ||
    !isPrivacyImageKey(doc)
  )
    return { ok: false, code: 'ERR_NOT_FOUND' };
  const object = await reader.get(doc.ocrImageKey!);
  if (!object) return { ok: false, code: 'ERR_NOT_FOUND' };
  return { ok: true, value: { body: object.body, contentType: 'image/png' } };
}
