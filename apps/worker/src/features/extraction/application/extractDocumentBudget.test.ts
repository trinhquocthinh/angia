import { describe, expect, it } from 'vitest';
import { createMemoryExtractionDeps } from '@src/shared/test/createMemoryExtractionDeps.js';
import { ImageConversionError } from './ImageConversionError.js';
import { extractDocument } from './extractDocument.js';

const prescription = { type: 'prescription' as const, items: [{ name: 'Amlodipin' }] };
const job = { documentId: 'doc-1', familyId: 'family-a', finalAttempt: false };

describe('Giữ ngân sách AI trước lời gọi (SPEC-009, BR-018, E3-S6-T1, F03a)', () => {
  it('TC-027: đã dùng $1.00 / trần $5.00 → pending_review, chi phí tháng tăng đúng chi phí thực', async () => {
    const memory = createMemoryExtractionDeps({
      result: { ok: true, content: prescription },
      budget: { spentUsd: 1 },
    });
    expect(await extractDocument(memory.deps, job)).toEqual({ status: 'pending_review', costUsd: 0.001 });
    expect(memory.ledger.spentUsd()).toBe(1.001);
    expect(memory.ledger.hasReservation()).toBe(false);
  });

  it('TC-028: đã dùng $4.99 / trần $5.00, ước tính $0.02 → awaiting_budget, không gọi AI', async () => {
    const memory = createMemoryExtractionDeps({
      result: { ok: true, content: prescription },
      budget: { spentUsd: 4.99 },
    });
    expect(await extractDocument(memory.deps, job)).toEqual({ status: 'awaiting_budget' });
    expect(memory.extractorCalls).toHaveLength(0);
    expect(memory.statusHistory).toEqual(['awaiting_budget']);
    expect(memory.ledger.spentUsd()).toBe(4.99);
  });

  it('TC-083: đã dùng $4.98 / trần $5.00, ước tính $0.02 → được xử lý (≤ trần)', async () => {
    const memory = createMemoryExtractionDeps({
      result: { ok: true, content: prescription },
      budget: { spentUsd: 4.98 },
    });
    expect(await extractDocument(memory.deps, job)).toEqual({ status: 'pending_review', costUsd: 0.001 });
    expect(memory.extractorCalls).toHaveLength(1);
    expect(memory.ledger.spentUsd()).toBe(4.981);
  });

  it('phản hồi sai schema vẫn tốn tiền: manual_entry và chi phí thực được ghi', async () => {
    const memory = createMemoryExtractionDeps({
      result: { ok: false, reason: 'schema_mismatch' },
      budget: { spentUsd: 1 },
    });
    expect(await extractDocument(memory.deps, job)).toMatchObject({ status: 'manual_entry' });
    expect(memory.ledger.spentUsd()).toBe(1.001);
  });

  it('lỗi mạng chưa hết lượt: trả lại chỗ giữ rồi ném để pg-boss thử lại — không tính trùng', async () => {
    const memory = createMemoryExtractionDeps({ result: new Error('mạng'), budget: { spentUsd: 1 } });
    await expect(extractDocument(memory.deps, job)).rejects.toThrow('mạng');
    expect(memory.ledger.spentUsd()).toBe(1);
    expect(memory.ledger.hasReservation()).toBe(false);
    expect(memory.statusHistory).toEqual(['extracting']);
  });

  it('lỗi mạng ở lần thử cuối → manual_entry, chỗ giữ được trả lại', async () => {
    const memory = createMemoryExtractionDeps({ result: new Error('mạng'), budget: { spentUsd: 1 } });
    expect(await extractDocument(memory.deps, { ...job, finalAttempt: true })).toMatchObject({
      status: 'manual_entry',
      reason: 'extractor_failed',
    });
    expect(memory.ledger.spentUsd()).toBe(1);
    expect(memory.ledger.hasReservation()).toBe(false);
  });

  it('chỗ giữ còn sót từ lần worker chết được dùng lại, không giữ thêm', async () => {
    const memory = createMemoryExtractionDeps({
      result: { ok: true, content: prescription },
      budget: { spentUsd: 4.99, reservedUsd: 0.02 },
    });
    expect(await extractDocument(memory.deps, job)).toEqual({ status: 'pending_review', costUsd: 0.001 });
    expect(memory.ledger.spentUsd()).toBe(4.971);
  });

  it('ảnh OCR không dùng được → manual_entry, trả lại chỗ giữ, không gọi AI', async () => {
    const memory = createMemoryExtractionDeps({
      result: new ImageConversionError(),
      budget: { spentUsd: 1 },
    });
    expect(await extractDocument(memory.deps, job)).toMatchObject({ reason: 'image_unusable' });
    expect(memory.ledger.spentUsd()).toBe(1);
    expect(memory.ledger.hasReservation()).toBe(false);
  });

  it('thiếu xác nhận riêng tư → manual_entry trước khi giữ ngân sách', async () => {
    const memory = createMemoryExtractionDeps({
      status: 'uploaded',
      result: { ok: true, content: prescription },
      budget: { spentUsd: 4.99 },
    });
    expect(await extractDocument(memory.deps, job)).toMatchObject({ reason: 'privacy_required' });
    expect(memory.ledger.hasReservation()).toBe(false);
  });
});
