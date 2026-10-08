import type { PrivacyDocument } from '@src/features/documentPrivacy/domain/PrivacyDocument.js';
export function createPrivacyTestDocument(): PrivacyDocument {
  return {
    id: 'doc',
    familyId: 'family',
    healthProfileId: 'profile',
    batchId: 'batch',
    type: null,
    status: 'awaiting_privacy',
    documentDate: null,
    originalKey: 'families/family/profiles/profile/documents/doc/original.jpg',
    previewKey: null,
    mimeType: 'image/jpeg',
    sizeBytes: 9,
    createdAt: new Date(),
    privacyDraftId: null,
    privacyDraftStatus: null,
    ocrImageKey: null,
    ocrImageSha256: null,
    privacyApprovedBy: null,
    privacyApprovedAt: null,
  };
}
