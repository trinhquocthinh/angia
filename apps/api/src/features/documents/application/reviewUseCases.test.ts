import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import type { SourceDocument } from '../domain/SourceDocument.js';
import { getDocumentReview } from './getDocumentReview.js';
import { listDocuments } from './listDocuments.js';
import { openDocumentImage } from './openDocumentImage.js';
import type { ObjectReader } from './reviewPorts.js';

const doc = (id: string, overrides: Partial<SourceDocument> = {}): SourceDocument => ({
  id,
  familyId: 'family-a',
  healthProfileId: 'me',
  batchId: 'batch',
  type: 'device_reading',
  status: 'pending_review',
  documentDate: null,
  originalKey: `k/${id}/original.heic`,
  previewKey: null,
  mimeType: 'image/heic',
  sizeBytes: 10,
  createdAt: new Date('2026-10-06T00:00:00Z'),
  ...overrides,
});
const reader: ObjectReader = {
  get: async (key) =>
    key.startsWith('k/') ? { body: new Blob([key]).stream(), contentType: 'binary/octet-stream' } : null,
};

describe('Đọc hàng đợi và chứng từ để duyệt (SPEC-006, SPEC-010)', () => {
  const memory = createMemoryReviewRepository(
    [doc('a'), doc('b', { status: 'approved' }), doc('c', { familyId: 'family-b' })],
    { a: { type: 'device_reading' } },
  );

  it('lọc theo trạng thái và chỉ trong gia đình của phiên', async () => {
    const list = await listDocuments(memory.repository, 'family-a', { statuses: ['pending_review'] });
    expect(list.map((d) => d.id)).toEqual(['a']);
    const all = await listDocuments(memory.repository, 'family-a', {
      statuses: ['pending_review', 'approved'],
    });
    expect(all.map((d) => d.id)).toEqual(['a', 'b']);
  });

  it('trả chứng từ kèm payload trích xuất; chứng từ nhóm khác → ERR_NOT_FOUND', async () => {
    expect(await getDocumentReview(memory.repository, 'family-a', 'a')).toMatchObject({
      ok: true,
      value: { document: { id: 'a' }, extraction: { type: 'device_reading' } },
    });
    expect(await getDocumentReview(memory.repository, 'family-a', 'c')).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });

  it('ảnh gốc giữ MIME đã nhận diện; preview chưa có thì dùng ảnh gốc', async () => {
    const image = await openDocumentImage(memory.repository, reader, {
      familyId: 'family-a',
      documentId: 'a',
      variant: 'preview',
    });
    expect(image).toMatchObject({ ok: true, value: { contentType: 'image/heic' } });
    expect(
      await openDocumentImage(memory.repository, reader, {
        familyId: 'family-a',
        documentId: 'c',
        variant: 'original',
      }),
    ).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });
});
