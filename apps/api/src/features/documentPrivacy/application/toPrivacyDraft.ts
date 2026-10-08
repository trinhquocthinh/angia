import type { PrivacyDocument } from '../domain/PrivacyDocument.js';
import { isPrivacyImageKey } from '../domain/isPrivacyImageKey.js';
import type { PrivacyDraft } from './ports.js';
export function toPrivacyDraft(doc: PrivacyDocument): PrivacyDraft {
  if (!doc.privacyDraftId || !doc.privacyDraftStatus) return { state: 'none' };
  if (doc.privacyDraftStatus === 'ready') {
    if (!doc.ocrImageSha256 || !isPrivacyImageKey(doc))
      return { state: 'failed', draftId: doc.privacyDraftId };
    return {
      state: 'ready',
      draftId: doc.privacyDraftId,
      sha256: doc.ocrImageSha256,
      imageUrl: `/api/source-documents/${doc.id}/privacy-drafts/${doc.privacyDraftId}/image`,
    };
  }
  return { state: doc.privacyDraftStatus, draftId: doc.privacyDraftId };
}
