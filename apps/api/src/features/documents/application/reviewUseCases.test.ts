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
  imageKey: `k/${id}/image.jpg`,
  imageSha256: 'a'.repeat(64),
  privacyApprovedBy: null,
  mimeType: 'image/jpeg',
  sizeBytes: 10,
  createdAt: new Date('2026-10-06T00:00:00Z'),
  ...overrides,
});
const reader: ObjectReader = {
  get: async (key) =>
    key.startsWith('k/') ? { body: new Blob([key]).stream(), contentType: 'binary/octet-stream' } : null,
};

describe('TC-380: hồ sơ đã rút đồng thuận', () => {
  const withdrawn = () =>
    createMemoryReviewRepository([doc('a')], { a: { type: 'device_reading' } }, [
      { id: 'me', familyId: 'family-a', consentStatus: 'withdrawn' },
    ]);
  it('đọc review và ảnh → ERR_CONSENT_REQUIRED, không đọc payload trích xuất hay ảnh', async () => {
    const memory = withdrawn();
    let extractionReads = 0;
    const repository: typeof memory.repository = {
      withFamily: (familyId, work) =>
        memory.repository.withFamily(familyId, (store) =>
          work({
            ...store,
            findLatestExtraction: async (id) => {
              extractionReads += 1;
              return store.findLatestExtraction(id);
            },
          }),
        ),
    };
    let imageReads = 0;
    const spyReader: ObjectReader = {
      get: async (key) => {
        imageReads += 1;
        return reader.get(key);
      },
    };
    const blocked = { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    expect(await getDocumentReview(repository, 'family-a', 'a')).toEqual(blocked);
    expect(await openDocumentImage(repository, spyReader, { familyId: 'family-a', documentId: 'a' })).toEqual(
      blocked,
    );
    expect(extractionReads).toBe(0);
    expect(imageReads).toBe(0);
  });
});

describe('Đọc hàng đợi và chứng từ để duyệt (SPEC-006, SPEC-010)', () => {
  const memory = createMemoryReviewRepository(
    [doc('a'), doc('b', { status: 'approved' }), doc('c', { familyId: 'family-b' })],
    { a: { type: 'device_reading' } },
  );

  it('lọc theo trạng thái và chỉ trong gia đình của phiên', async () => {
    const list = await listDocuments(memory.repository, 'family-a', {
      statuses: ['pending_review'],
      limit: 50,
    });
    expect(list.items.map((d) => d.id)).toEqual(['a']);
    const all = await listDocuments(memory.repository, 'family-a', {
      statuses: ['pending_review', 'approved'],
      limit: 50,
    });
    expect(all.items.map((d) => d.id)).toEqual(['a', 'b']);
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

  it('TC-408: trả JPEG duy nhất; chứng từ nhóm khác → ERR_NOT_FOUND', async () => {
    const image = await openDocumentImage(memory.repository, reader, {
      familyId: 'family-a',
      documentId: 'a',
    });
    expect(image).toMatchObject({ ok: true, value: { contentType: 'image/jpeg' } });
    expect(
      await openDocumentImage(memory.repository, reader, {
        familyId: 'family-a',
        documentId: 'c',
      }),
    ).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });
});
