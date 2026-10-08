import { describe, expect, it } from 'vitest';
import { createMemoryExtractionDeps } from '@src/shared/test/createMemoryExtractionDeps.js';
import { ImageConversionError } from './ImageConversionError.js';
import { extractDocument } from './extractDocument.js';

const prescription = { type: 'prescription' as const, items: [{ name: 'Amlodipin' }] };
const job = { documentId: 'doc-1', familyId: 'family-a', finalAttempt: false };

describe('Trích xuất chứng từ bằng Vision-LLM (SPEC-009, E2-S5-T2)', () => {
  it('TC-027 (phần trạng thái): đơn thuốc in máy → Extraction + pending_review, loại lấy theo AI', async () => {
    const memory = createMemoryExtractionDeps({ result: { ok: true, content: prescription } });
    expect(await extractDocument(memory.deps, job)).toEqual({ status: 'pending_review', costUsd: 0.001 });
    expect(memory.statusHistory).toEqual(['extracting', 'pending_review']);
    expect(memory.extractions).toEqual([
      {
        documentId: 'doc-1',
        type: 'prescription',
        provider: 'openrouter',
        model: 'google/gemini-3.1-flash-lite',
        payload: prescription,
        costUsd: 0.001,
      },
    ]);
  });

  it('TC-029: AI trả về rỗng → manual_entry, không tạo Extraction', async () => {
    const memory = createMemoryExtractionDeps({
      result: { ok: true, content: { type: 'prescription', items: [] } },
    });
    expect(await extractDocument(memory.deps, job)).toEqual({
      status: 'manual_entry',
      reason: 'empty',
      costUsd: 0.001,
    });
    expect(memory.statusHistory).toEqual(['extracting', 'manual_entry']);
    expect(memory.extractions).toEqual([]);
  });

  it('khai đơn thuốc nhưng AI nhận ra loại khác → manual_entry type_mismatch', async () => {
    const lab = { type: 'lab_result' as const, items: [{ testName: 'HbA1c' }] };
    const memory = createMemoryExtractionDeps({
      declaredType: 'prescription',
      result: { ok: true, content: lab },
    });
    expect(await extractDocument(memory.deps, job)).toMatchObject({
      status: 'manual_entry',
      reason: 'type_mismatch',
    });
    expect(memory.extractions).toEqual([]);
  });

  it('JSON sai schema → manual_entry ngay, không ném lỗi để khỏi gọi AI lại', async () => {
    const memory = createMemoryExtractionDeps({ result: { ok: false, reason: 'schema_mismatch' } });
    expect(await extractDocument(memory.deps, job)).toMatchObject({
      status: 'manual_entry',
      reason: 'schema_mismatch',
    });
  });

  it('lỗi gọi AI chưa phải lần cuối → ném lỗi cho pg-boss thử lại, chứng từ giữ extracting', async () => {
    const memory = createMemoryExtractionDeps({ result: new Error('HTTP 503') });
    await expect(extractDocument(memory.deps, job)).rejects.toThrow('HTTP 503');
    expect(memory.statusHistory).toEqual(['extracting']);
  });

  it('TC-087 (một model): lỗi gọi AI ở lần thử cuối → manual_entry, ảnh gốc giữ nguyên', async () => {
    const memory = createMemoryExtractionDeps({ status: 'extracting', result: new Error('fetch failed') });
    expect(await extractDocument(memory.deps, { ...job, finalAttempt: true })).toEqual({
      status: 'manual_entry',
      reason: 'extractor_failed',
      costUsd: 0,
    });
    expect(memory.statusHistory).toEqual(['extracting', 'manual_entry']);
    expect(memory.objects.has('families/family-a/profiles/me/documents/doc-1/original.jpg')).toBe(true);
  });

  it('TC-079: AI chỉ nhận byte ảnh và mimeType, không có ID hồ sơ/nhóm/chứng từ', async () => {
    const memory = createMemoryExtractionDeps({ result: { ok: true, content: prescription } });
    await extractDocument(memory.deps, job);
    expect(memory.extractorCalls).toEqual([{ bytes: memory.approvedBytes, mimeType: 'image/jpeg' }]);
  });

  it('ảnh gốc HEIC không được đọc: chỉ gửi bản JPEG OCR đã duyệt', async () => {
    const memory = createMemoryExtractionDeps({
      mimeType: 'image/heic',
      result: { ok: true, content: prescription },
    });
    await extractDocument(memory.deps, job);
    expect(memory.extractorCalls).toEqual([{ bytes: new Uint8Array([0xff, 0xd8]), mimeType: 'image/jpeg' }]);
  });

  it('chứng từ đã pending_review, không tồn tại hoặc thuộc nhóm khác → bỏ qua, không gọi AI', async () => {
    const reviewed = createMemoryExtractionDeps({
      status: 'pending_review',
      result: new Error('không được gọi'),
    });
    expect(await extractDocument(reviewed.deps, job)).toEqual({ status: 'skipped' });
    for (const other of [{ documentId: 'khong-co' }, { familyId: 'family-b' }]) {
      const memory = createMemoryExtractionDeps({ result: new Error('không được gọi') });
      expect(await extractDocument(memory.deps, { ...job, ...other })).toEqual({ status: 'skipped' });
      expect(memory.extractorCalls).toEqual([]);
    }
  });
});

it('TC-125: ảnh không xử lý được → nhập tay ngay, không gọi AI, giữ ảnh gốc', async () => {
  const memory = createMemoryExtractionDeps({
    mimeType: 'image/heic',
    result: new Error('không được gọi'),
  });
  memory.deps.ocrImages.get = async () => {
    throw new ImageConversionError();
  };
  expect(await extractDocument(memory.deps, job)).toEqual({
    status: 'manual_entry',
    reason: 'image_unusable',
    costUsd: 0,
  });
  expect(memory.extractorCalls).toEqual([]);
  expect(memory.statusHistory).toEqual(['extracting', 'manual_entry']);
  expect(memory.objects.has('families/family-a/profiles/me/documents/doc-1/original.jpg')).toBe(true);
});

it('TC-150: thiếu xác nhận riêng tư → chặn AI và chuyển job OCR cũ sang nhập tay', async () => {
  const memory = createMemoryExtractionDeps({ result: { ok: true, content: prescription } });
  const original = memory.deps.repository.withFamily;
  memory.deps.repository.withFamily = (family, work) =>
    original(family, (store) =>
      work({
        ...store,
        findDocument: async (id) => {
          const document = await store.findDocument(id);
          return document ? { ...document, privacyApprovedAt: null } : null;
        },
      }),
    );
  expect(await extractDocument(memory.deps, job)).toEqual({
    status: 'manual_entry',
    reason: 'privacy_required',
    costUsd: 0,
  });
  expect(memory.extractorCalls).toEqual([]);
});

it('TC-151: byte bản OCR đổi → hash không khớp, không AI hoặc fallback ảnh gốc', async () => {
  const memory = createMemoryExtractionDeps({ result: { ok: true, content: prescription } });
  memory.objects.set(memory.ocrKey, new Uint8Array([0xff, 0xd8, 1]));
  expect(await extractDocument(memory.deps, job)).toMatchObject({
    status: 'manual_entry',
    reason: 'image_unusable',
    costUsd: 0,
  });
  expect(memory.extractorCalls).toEqual([]);
});
it('TC-152: bản OCR trỏ sang gia đình khác → chặn trước đọc ảnh', async () => {
  const memory = createMemoryExtractionDeps({ result: { ok: true, content: prescription } });
  const original = memory.deps.repository.withFamily;
  memory.deps.repository.withFamily = (family, work) =>
    original(family, (store) =>
      work({
        ...store,
        findDocument: async (id) => {
          const document = await store.findDocument(id);
          return document ? { ...document, ocrImageKey: 'families/other/ocr.jpg' } : null;
        },
      }),
    );
  expect(await extractDocument(memory.deps, job)).toMatchObject({
    status: 'manual_entry',
    reason: 'privacy_required',
  });
  expect(memory.extractorCalls).toEqual([]);
});

it('TC-159: khóa OCR trùng preview → chặn AI trước đọc ảnh', async () => {
  const memory = createMemoryExtractionDeps({ result: { ok: true, content: prescription } });
  const original = memory.deps.repository.withFamily;
  memory.deps.repository.withFamily = (family, work) =>
    original(family, (store) =>
      work({
        ...store,
        findDocument: async (id) => {
          const document = await store.findDocument(id);
          return document ? { ...document, previewKey: document.ocrImageKey } : null;
        },
      }),
    );
  expect(await extractDocument(memory.deps, job)).toMatchObject({
    status: 'manual_entry',
    reason: 'privacy_required',
  });
  expect(memory.extractorCalls).toEqual([]);
});
