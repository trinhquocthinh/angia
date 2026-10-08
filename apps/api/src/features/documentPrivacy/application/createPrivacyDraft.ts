import type { PrivacyOutcome } from '../domain/PrivacyDocument.js';
import { validPrivacyEdits, type PrivacyEdits } from '../domain/privacyEdits.js';
import type { PrivacyDependencies, PrivacyDraft } from './ports.js';
export async function createPrivacyDraft(
  deps: PrivacyDependencies,
  input: { familyId: string; documentId: string; edits: PrivacyEdits },
): Promise<PrivacyOutcome<PrivacyDraft>> {
  if (!validPrivacyEdits(input.edits)) return { ok: false, code: 'ERR_VALIDATION' };
  return deps.repository.withFamily(input.familyId, async (store) => {
    const doc = await store.findDocument(input.documentId, true);
    if (!doc) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (doc.status !== 'awaiting_privacy' || doc.privacyApprovedAt || doc.privacyDraftStatus === 'pending')
      return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
    if (!(await store.consentConfirmed(doc.healthProfileId)))
      return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    const draftId = deps.newId();
    await store.updateDocument(doc.id, {
      privacyDraftId: draftId,
      privacyDraftStatus: 'pending',
      ocrImageKey: null,
      ocrImageSha256: null,
    });
    await store.enqueuePreparation(doc.id, draftId, input.edits);
    return { ok: true, value: { draftId, state: 'pending' } };
  });
}
