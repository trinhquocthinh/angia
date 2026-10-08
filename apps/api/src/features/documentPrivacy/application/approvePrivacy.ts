import type { PrivacyOutcome, PrivacyDocument } from '../domain/PrivacyDocument.js';
import { isPrivacyImageKey } from '../domain/isPrivacyImageKey.js';
import type { PrivacyDependencies } from './ports.js';
export interface ApprovalInput {
  familyId: string;
  documentId: string;
  accountId: string;
  draftId: string;
  sha256: string;
  confirmed: true;
}
export async function approvePrivacy(
  deps: PrivacyDependencies,
  input: ApprovalInput,
): Promise<PrivacyOutcome<PrivacyDocument>> {
  const candidate = await deps.repository.withFamily(input.familyId, (store) =>
    store.findDocument(input.documentId),
  );
  if (!candidate) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (
    !input.confirmed ||
    candidate.privacyDraftId !== input.draftId ||
    candidate.ocrImageSha256 !== input.sha256
  )
    return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  if (candidate.privacyApprovedAt) return { ok: true, value: candidate };
  if (
    candidate.status !== 'awaiting_privacy' ||
    candidate.privacyDraftStatus !== 'ready' ||
    !isPrivacyImageKey(candidate)
  )
    return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  const object = await deps.reader.get(candidate.ocrImageKey!);
  if (!object || (await deps.hashPng(object.body)) !== input.sha256)
    return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  return deps.repository.withFamily(input.familyId, async (store) => {
    const doc = await store.findDocument(input.documentId, true);
    if (!doc) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (
      doc.privacyDraftId !== input.draftId ||
      doc.ocrImageSha256 !== input.sha256 ||
      doc.ocrImageKey !== candidate.ocrImageKey
    )
      return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
    if (doc.privacyApprovedAt) return { ok: true, value: doc };
    if (doc.status !== 'awaiting_privacy' || doc.privacyDraftStatus !== 'ready')
      return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
    if (!(await store.consentConfirmed(doc.healthProfileId)))
      return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    const approved = await store.updateDocument(doc.id, {
      status: 'extracting',
      privacyApprovedBy: input.accountId,
      privacyApprovedAt: deps.now(),
    });
    await store.enqueueExtraction(doc.id);
    return { ok: true, value: approved };
  });
}
