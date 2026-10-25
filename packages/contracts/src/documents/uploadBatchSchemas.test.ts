import { describe, expect, it } from 'vitest';
import { sourceDocumentSchema } from './uploadBatchSchemas.js';

const document = {
  id: '0199bc85-8918-7000-8000-000000000001',
  healthProfileId: '0199bc85-8918-7000-8000-000000000002',
  batchId: '0199bc85-8918-7000-8000-000000000003',
  type: null,
  status: 'awaiting_privacy',
  documentDate: null,
  mimeType: 'image/heic',
  sizeBytes: 1000,
  createdAt: '2026-10-08T03:00:00Z',
};

describe('Hợp đồng chứng từ chờ duyệt riêng tư', () => {
  it('TC-116: nhận trạng thái awaiting_privacy và từ chối trạng thái không định nghĩa', () => {
    expect(sourceDocumentSchema.safeParse(document).success).toBe(true);
    expect(sourceDocumentSchema.safeParse({ ...document, status: 'privacy_passed' }).success).toBe(false);
  });

  it('TC-116: DTO công khai không chứa khóa S3, hash hoặc người duyệt riêng tư', () => {
    const result = sourceDocumentSchema.parse({
      ...document,
      originalKey: 'private/original.heic',
      ocrImageKey: 'private/ocr.jpg',
      ocrImageSha256: 'a'.repeat(64),
      privacyApprovedBy: document.id,
      privacyApprovedAt: document.createdAt,
    });
    expect(result).toEqual(document);
  });
});
