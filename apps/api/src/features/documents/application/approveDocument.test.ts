import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import type { SourceDocument } from '../domain/SourceDocument.js';
import { approveDocument, type ApproveRequest } from './approveDocument.js';

const document = (overrides: Partial<SourceDocument> = {}): SourceDocument => ({
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
const request = (
  data: Partial<ApproveRequest['data']> = {},
  confirmOutOfRange?: boolean,
): ApproveRequest => ({
  familyId: 'family-a',
  documentId: 'doc-1',
  type: 'device_reading',
  confirmOutOfRange,
  data: {
    type: 'device_reading',
    measuredAt: '2026-10-05',
    measuredTime: '07:10',
    kind: 'blood_pressure',
    systolic: 145,
    diastolic: 90,
    pulse: 78,
    glucoseValue: null,
    glucoseUnit: null,
    ...data,
  },
});

describe('Phê duyệt số đo từ ảnh máy đo (SPEC-010, SPEC-019)', () => {
  it('lưu Measurement gắn sourceDocumentId và chuyển chứng từ sang approved với ngày đo', async () => {
    const memory = createMemoryReviewRepository([document()]);
    const result = await approveDocument(memory.repository, request());
    expect(result.ok).toBe(true);
    expect(memory.measurements).toEqual([
      expect.objectContaining({
        healthProfileId: 'me',
        sourceDocumentId: 'doc-1',
        kind: 'blood_pressure',
        measuredOn: '2026-10-05',
        measuredTime: '07:10',
        systolic: 145,
        diastolic: 90,
        pulse: 78,
        manualWithoutSource: false,
      }),
    ]);
    expect(memory.documents[0]).toMatchObject({ status: 'approved', documentDate: '2026-10-05' });
  });

  it('SPEC-010 (biến thể số đo của TC-031): thiếu ngày đo → ERR_DOCUMENT_DATE_REQUIRED, vẫn pending_review', async () => {
    const memory = createMemoryReviewRepository([document()]);
    expect(await approveDocument(memory.repository, request({ measuredAt: null }))).toEqual({
      ok: false,
      code: 'ERR_DOCUMENT_DATE_REQUIRED',
    });
    expect(memory.documents[0]!.status).toBe('pending_review');
    expect(memory.measurements).toEqual([]);
  });

  it('TC-032: tâm thu 1300 chưa xác nhận → ERR_OUT_OF_RANGE_UNCONFIRMED kèm trường, không lưu', async () => {
    const memory = createMemoryReviewRepository([document()]);
    expect(await approveDocument(memory.repository, request({ systolic: 1300 }))).toEqual({
      ok: false,
      code: 'ERR_OUT_OF_RANGE_UNCONFIRMED',
      fields: ['systolic'],
    });
    expect(memory.measurements).toEqual([]);
  });

  it('TC-033: sửa 1300 thành 130 rồi duyệt → lưu giá trị 130', async () => {
    const memory = createMemoryReviewRepository([document()]);
    await approveDocument(memory.repository, request({ systolic: 130 }));
    expect(memory.measurements[0]).toMatchObject({ systolic: 130 });
  });

  it('TC-035: chứng từ đã approved → ERR_INVALID_STATE_TRANSITION', async () => {
    const memory = createMemoryReviewRepository([
      document({ status: 'approved', documentDate: '2026-10-05' }),
    ]);
    expect(await approveDocument(memory.repository, request())).toEqual({
      ok: false,
      code: 'ERR_INVALID_STATE_TRANSITION',
    });
  });

  it('SPEC-006: chứng từ của gia đình khác → ERR_NOT_FOUND', async () => {
    const memory = createMemoryReviewRepository([document({ familyId: 'family-b' })]);
    expect(await approveDocument(memory.repository, request())).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });

  it('loại chứng từ khác loại lệnh duyệt → ERR_VALIDATION', async () => {
    const memory = createMemoryReviewRepository([document({ type: 'prescription' })]);
    expect(await approveDocument(memory.repository, request())).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });

  it('BR-020: đường huyết chỉ lưu giá trị + đơn vị gốc, bỏ các trường huyết áp thừa', async () => {
    const memory = createMemoryReviewRepository([document()]);
    await approveDocument(
      memory.repository,
      request({ kind: 'glucose', glucoseValue: 126, glucoseUnit: 'mg/dL', systolic: 120 }),
    );
    expect(memory.measurements[0]).toMatchObject({
      kind: 'glucose',
      glucoseValue: 126,
      glucoseUnit: 'mg/dL',
      systolic: null,
      diastolic: null,
      pulse: null,
    });
  });
});
