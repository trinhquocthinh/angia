import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import { reviewDocument } from '@src/shared/test/reviewDocumentFixture.js';
import { openDocumentImage } from './openDocumentImage.js';
import type { ObjectReader } from './reviewPorts.js';

const request = { familyId: 'family-a', documentId: 'doc-1' };

describe('TC-408: đọc ảnh chứng từ duy nhất', () => {
  it('TC-408: đọc imageKey và trả JPEG kể cả khi kho trả MIME khác', async () => {
    const memory = createMemoryReviewRepository([reviewDocument({ imageKey: 'redacted.jpg' })]);
    const bytes = new Uint8Array([0xff, 0xd8, 0xff]);
    const reader: ObjectReader = {
      get: async (key) =>
        key === 'redacted.jpg'
          ? { body: new Blob([bytes]).stream(), contentType: 'application/octet-stream' }
          : null,
    };
    const result = await openDocumentImage(memory.repository, reader, request);
    expect(result).toMatchObject({ ok: true, value: { contentType: 'image/jpeg' } });
    if (!result.ok) throw new Error('Không đọc được ảnh');
    expect(new Uint8Array(await new Response(result.value.body).arrayBuffer())).toEqual(bytes);
  });

  it('TC-408: ảnh NULL → ERR_NOT_FOUND, không đọc kho ảnh', async () => {
    const memory = createMemoryReviewRepository([reviewDocument({ imageKey: null })]);
    const reader: ObjectReader = {
      get: async () => {
        throw new Error('Không được đọc kho ảnh');
      },
    };
    expect(await openDocumentImage(memory.repository, reader, request)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });

  it('TC-408: object đã mất → ERR_NOT_FOUND', async () => {
    const memory = createMemoryReviewRepository([reviewDocument({ imageKey: 'missing.jpg' })]);
    expect(await openDocumentImage(memory.repository, { get: async () => null }, request)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });

  it('TC-408: gia đình khác và hồ sơ rút đồng thuận không đọc kho ảnh', async () => {
    const memory = createMemoryReviewRepository([reviewDocument()], {}, [
      { id: 'me', familyId: 'family-a', consentStatus: 'withdrawn' },
    ]);
    const reader: ObjectReader = {
      get: async () => {
        throw new Error('Không được đọc kho ảnh');
      },
    };
    expect(await openDocumentImage(memory.repository, reader, { ...request, familyId: 'other' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await openDocumentImage(memory.repository, reader, request)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
  });
});
