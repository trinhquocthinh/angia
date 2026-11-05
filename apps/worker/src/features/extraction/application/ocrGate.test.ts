import { describe, expect, it, vi } from 'vitest';
import { createMemoryExtractionDeps } from '@src/shared/test/createMemoryExtractionDeps.js';
import { extractDocument } from './extractDocument.js';
import { recoverDeadExtraction } from './recoverDeadExtraction.js';
import { OcrGateBlockedError } from './OcrGateBlockedError.js';

const result = { ok: true as const, content: { type: 'prescription' as const, items: [{ name: 'A' }] } };
const job = { documentId: 'doc-1', familyId: 'family-a', finalAttempt: false };

describe('Cổng OCR tại giữ lượt và ngay trước HTTP', () => {
  it('TC-594: hết quota trước giữ lượt không đọc ảnh hoặc gọi AI', async () => {
    const memory = createMemoryExtractionDeps({ result });
    memory.ledger.store.reserveBudget = async () => {
      throw new OcrGateBlockedError('scan_quota_exhausted');
    };
    const read = vi.spyOn(memory.deps.ocrImages, 'get');
    expect(await extractDocument(memory.deps, job)).toEqual({
      status: 'awaiting_budget',
      reason: 'scan_quota_exhausted',
    });
    expect(read).not.toHaveBeenCalled();
    expect(memory.extractorCalls).toHaveLength(0);
  });

  it('TC-595: cổng đóng ngay trước gửi trả lượt giữ và chờ ngân sách', async () => {
    const memory = createMemoryExtractionDeps({ result });
    memory.ledger.store.dispatchBudget = async () => {
      throw new OcrGateBlockedError('billing_unavailable');
    };
    expect(await extractDocument(memory.deps, job)).toEqual({
      status: 'awaiting_budget',
      reason: 'billing_unavailable',
    });
    expect(memory.ledger.hasReservation()).toBe(false);
    expect(memory.extractorCalls).toHaveLength(0);
  });

  it('TC-596: đủ sáu lần gửi chuyển nhập tay, không thử lại', async () => {
    const memory = createMemoryExtractionDeps({ result });
    memory.ledger.store.dispatchBudget = async () => {
      throw new OcrGateBlockedError('dispatch_limit');
    };
    expect(await extractDocument(memory.deps, job)).toMatchObject({
      status: 'manual_entry',
      reason: 'extractor_failed',
    });
    expect(memory.ledger.hasReservation()).toBe(false);
  });

  it('TC-597: dead-letter trả chỗ giữ dù chứng từ đã chờ ngân sách', async () => {
    const memory = createMemoryExtractionDeps({
      status: 'awaiting_budget',
      result,
      budget: { reservedUsd: 0.02 },
    });
    expect(await recoverDeadExtraction(memory.deps, job)).toEqual({ status: 'skipped' });
    expect(memory.ledger.hasReservation()).toBe(false);
  });
  it.each([
    ['consent_required', { profileConsentConfirmed: false }],
    ['privacy_required', { imageSha256: 'changed' }],
  ] as const)(
    'TC-609: đọc lại %s trước gửi HTTP, trả chỗ giữ và chuyển nhập tay',
    async (reason, changed) => {
      const memory = createMemoryExtractionDeps({ result });
      const get = memory.deps.ocrImages.get;
      memory.deps.ocrImages.get = async (key) => {
        const image = await get(key);
        const withFamily = memory.deps.repository.withFamily;
        memory.deps.repository.withFamily = (familyId, work) =>
          withFamily(familyId, (store) => {
            const find = store.findDocument;
            return work({
              ...store,
              findDocument: async (id) => {
                const document = await find(id);
                return document ? { ...document, ...changed } : null;
              },
            });
          });
        return image;
      };
      expect(await extractDocument(memory.deps, job)).toMatchObject({ status: 'manual_entry', reason });
      expect(memory.extractorCalls).toHaveLength(0);
      expect(memory.ledger.usedScans()).toBe(0);
      expect(memory.ledger.hasReservation()).toBe(false);
    },
  );
  it('lượt đã gửi vẫn dùng sau lỗi mạng và recovery', async () => {
    const memory = createMemoryExtractionDeps({ result: new Error('mạng') });
    await expect(extractDocument(memory.deps, job)).rejects.toThrow('mạng');
    expect(memory.ledger.usedScans()).toBe(1);
    expect(memory.ledger.dispatches()).toBe(1);
    await recoverDeadExtraction(memory.deps, job);
    expect(memory.ledger.usedScans()).toBe(1);
    expect(memory.ledger.hasReservation()).toBe(false);
  });
});

it.each([
  ['consent_required', { profileConsentConfirmed: false }],
  ['skipped', { status: 'uploaded' as const }],
])('TC-626: %s ở lần retry trả held của lần chạy đã chết', async (reason, changes) => {
  const memory = createMemoryExtractionDeps({ result, budget: { held: true }, ...changes });
  expect(await extractDocument(memory.deps, job)).toMatchObject(
    reason === 'skipped' ? { status: 'skipped' } : { status: 'manual_entry', reason },
  );
  expect(memory.ledger.hasReservation()).toBe(false);
  expect(memory.extractorCalls).toHaveLength(0);
});

it('TC-632: dead-letter của job trùng không hủy operation còn job gốc chờ retry', async () => {
  const memory = createMemoryExtractionDeps({ result, budget: { held: true } });
  const original = memory.deps.repository.withFamily;
  memory.deps.repository.withFamily = (familyId, work) =>
    original(familyId, (store) =>
      work({
        ...store,
        hasLiveExtractionJob: async () => true,
      }),
    );
  expect(await recoverDeadExtraction(memory.deps, job)).toEqual({ status: 'skipped' });
  expect(memory.statusHistory).toEqual([]);
  expect(memory.ledger.hasReservation()).toBe(true);
});
