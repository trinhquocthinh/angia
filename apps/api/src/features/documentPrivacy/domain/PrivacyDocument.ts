import type { SourceDocument } from '../../documents/domain/SourceDocument.js';
export interface PrivacyDocument extends SourceDocument {
  privacyDraftId: string | null;
  privacyDraftStatus: 'pending' | 'ready' | 'failed' | null;
  ocrImageKey: string | null;
  ocrImageSha256: string | null;
  privacyApprovedBy: string | null;
  privacyApprovedAt: Date | null;
}
export type PrivacyOutcome<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | 'ERR_INVALID_STATE_TRANSITION' | 'ERR_VALIDATION';
    };
