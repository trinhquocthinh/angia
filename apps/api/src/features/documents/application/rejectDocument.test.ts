import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import { reviewDocument } from '@src/shared/test/reviewDocumentFixture.js';
import type { DocumentStatus } from '../domain/SourceDocument.js';
import { rejectDocument } from './rejectDocument.js';

const reject = (status: DocumentStatus, familyId = 'family-a') => {
  const memory = createMemoryReviewRepository([reviewDocument({ status, familyId })]);
  return { memory, result: rejectDocument(memory.repository, 'family-a', 'doc-1') };
};

describe('Loại bỏ chứng từ (SPEC-010, BR §3.1)', () => {
  it.each(['pending_review', 'manual_entry'] as const)(
    '%s → rejected, ảnh gốc giữ nguyên',
    async (status) => {
      const { memory, result } = reject(status);
      expect(await result).toMatchObject({ ok: true, value: { status: 'rejected' } });
      expect(memory.documents[0]).toMatchObject({
        status: 'rejected',
        originalKey: 'families/family-a/profiles/me/documents/doc-1/original.jpg',
      });
    },
  );

  it.each(['approved', 'rejected', 'extracting', 'awaiting_privacy'] as const)(
    '%s → ERR_INVALID_STATE_TRANSITION, không đổi trạng thái',
    async (status) => {
      const { memory, result } = reject(status);
      expect(await result).toEqual({ ok: false, code: 'ERR_INVALID_STATE_TRANSITION' });
      expect(memory.documents[0]!.status).toBe(status);
    },
  );

  it('SPEC-006: chứng từ gia đình khác → ERR_NOT_FOUND', async () => {
    const { memory, result } = reject('pending_review', 'family-b');
    expect(await result).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(memory.documents[0]!.status).toBe('pending_review');
  });
});
