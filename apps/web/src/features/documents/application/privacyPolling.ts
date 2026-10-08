import type { PrivacyDraft } from '@angia/contracts';
export const privacyPollInterval = (draft: PrivacyDraft | undefined): number | false =>
  draft?.state === 'pending' ? 3000 : false;
