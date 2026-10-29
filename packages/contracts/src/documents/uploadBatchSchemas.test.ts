import { describe, expect, it } from 'vitest';
import { sourceDocumentSchema, uploadBatchRequestSchema } from './uploadBatchSchemas.js';

const document = {
  id: '0199bc85-8918-7000-8000-000000000001',
  healthProfileId: '0199bc85-8918-7000-8000-000000000002',
  batchId: '0199bc85-8918-7000-8000-000000000003',
  type: null,
  status: 'uploaded',
  hasImage: true,
  documentDate: null,
  mimeType: 'image/jpeg',
  sizeBytes: 1000,
  createdAt: '2026-10-28T03:00:00Z',
};

describe('Hợp đồng chứng từ một ảnh đã che', () => {
  it('TC-403: nhận sáu trạng thái mới, từ chối trạng thái đã bỏ', () => {
    for (const status of [
      'uploaded',
      'extracting',
      'pending_review',
      'approved',
      'manual_entry',
      'awaiting_budget',
    ]) {
      expect(sourceDocumentSchema.safeParse({ ...document, status }).success).toBe(true);
    }
    for (const status of ['awaiting_privacy', 'rejected', 'privacy_passed']) {
      expect(sourceDocumentSchema.safeParse({ ...document, status }).success).toBe(false);
    }
  });

  it('TC-409: hasImage bắt buộc là boolean, nhận cả chứng từ không còn ảnh', () => {
    expect(sourceDocumentSchema.safeParse({ ...document, hasImage: false }).success).toBe(true);
    for (const hasImage of [undefined, null, 'true', 1]) {
      expect(sourceDocumentSchema.safeParse({ ...document, hasImage }).success).toBe(false);
    }
  });

  it('TC-409: DTO công khai loại khóa ảnh, hash và thông tin người đồng ý', () => {
    expect(
      sourceDocumentSchema.parse({
        ...document,
        imageKey: 'private/image.jpg',
        imageSha256: 'a'.repeat(64),
        privacyApprovedBy: document.id,
        privacyApprovedAt: document.createdAt,
      }),
    ).toEqual(document);
  });

  it('TC-405: sendToAi tùy chọn và nhận chuỗi multipart', () => {
    const files = new File(['jpeg'], 'anh.jpg', { type: 'image/jpeg' });
    expect(uploadBatchRequestSchema.safeParse({ files }).success).toBe(true);
    expect(uploadBatchRequestSchema.parse({ files, sendToAi: '[true]' }).sendToAi).toBe('[true]');
    expect(uploadBatchRequestSchema.safeParse({ files, sendToAi: [true] }).success).toBe(false);
  });
});
