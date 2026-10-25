import { describe, expect, it } from 'vitest';
import { createMemoryExtractionDeps } from '@src/shared/test/createMemoryExtractionDeps.js';
import { recoverDeadExtraction } from './recoverDeadExtraction.js';

const prescription = { type: 'prescription' as const, items: [{ name: 'Amlodipin' }] };
const job = { documentId: 'doc-1', familyId: 'family-a' };

describe('Phục hồi chứng từ kẹt extracting khi job chết (nợ #20, F08a, E3-S6-T1)', () => {
  it('worker chết ở lần thử cuối, còn chỗ giữ → manual_entry và trả lại chỗ giữ', async () => {
    const memory = createMemoryExtractionDeps({
      result: { ok: true, content: prescription },
      budget: { spentUsd: 1.02, reservedUsd: 0.02 },
    });
    expect(await recoverDeadExtraction(memory.deps, job)).toEqual({ status: 'manual_entry' });
    expect(memory.statusHistory).toEqual(['manual_entry']);
    expect(memory.ledger.spentUsd()).toBe(1);
    expect(memory.ledger.hasReservation()).toBe(false);
  });

  it('chạy lặp (dead-letter thử lại) không trừ ngân sách lần hai', async () => {
    const memory = createMemoryExtractionDeps({
      result: { ok: true, content: prescription },
      budget: { spentUsd: 1.02, reservedUsd: 0.02 },
    });
    await recoverDeadExtraction(memory.deps, job);
    await recoverDeadExtraction(memory.deps, job);
    expect(memory.ledger.spentUsd()).toBe(1);
  });

  it('chứng từ đã có kết quả (pending_review) → bỏ qua, không đổi trạng thái', async () => {
    const memory = createMemoryExtractionDeps({
      status: 'pending_review',
      result: { ok: true, content: prescription },
    });
    expect(await recoverDeadExtraction(memory.deps, job)).toEqual({ status: 'skipped' });
    expect(memory.statusHistory).toEqual([]);
  });

  it('familyId không khớp chứng từ (RLS che) → bỏ qua', async () => {
    const memory = createMemoryExtractionDeps({ result: { ok: true, content: prescription } });
    expect(await recoverDeadExtraction(memory.deps, { ...job, familyId: 'family-b' })).toEqual({
      status: 'skipped',
    });
    expect(memory.statusHistory).toEqual([]);
  });
});
