import type { PrivacyDraft } from '@angia/contracts';
export const privacyCandidateKey = (draft: PrivacyDraft) =>
  draft.state === 'ready' ? `${draft.draftId}:${draft.sha256}` : null;
