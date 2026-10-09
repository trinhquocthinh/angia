import type { SourceDocument } from '@src/features/documents/domain/SourceDocument.js';

// Chứng từ chờ duyệt mặc định cho unit test use case duyệt/loại bỏ.
export const reviewDocument = (overrides: Partial<SourceDocument> = {}): SourceDocument => ({
  id: 'doc-1',
  familyId: 'family-a',
  healthProfileId: 'me',
  batchId: 'batch-1',
  type: 'device_reading',
  status: 'pending_review',
  documentDate: null,
  originalKey: 'families/family-a/profiles/me/documents/doc-1/original.jpg',
  previewKey: null,
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
  createdAt: new Date('2026-10-06T00:00:00Z'),
  ...overrides,
});
