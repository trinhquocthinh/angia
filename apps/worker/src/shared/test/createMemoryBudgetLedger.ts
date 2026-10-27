import { OcrGateBlockedError } from '@src/features/extraction/application/OcrGateBlockedError.js';
import type { ExtractionStore } from '@src/features/extraction/application/ports.js';

export interface MemoryBudgetOptions {
  spentUsd?: number;
  capUsd?: number;
  /** Tương thích fixture cũ: chỉ biểu thị một lượt còn giữ; không còn là tiền giữ. */
  reservedUsd?: number;
  scanCap?: number;
  usedScans?: number;
  held?: boolean;
}

/** Cổng giả: tiền là số đã đối soát, settle chỉ trả lượt giữ và giữ nguyên lượt đã dùng. */
export function createMemoryBudgetLedger(
  documentId: string,
  _month: string,
  options: MemoryBudgetOptions = {},
) {
  let held = options.held ?? !!options.reservedUsd;
  let used = options.usedScans ?? 0;
  let dispatched = 0;
  let operationUsed = false;
  const spent = options.spentUsd ?? 0;
  const checkGate = () => {
    if (spent >= (options.capUsd ?? 5)) throw new OcrGateBlockedError('budget_exhausted');
  };
  const store: Pick<ExtractionStore, 'reserveBudget' | 'settleBudget' | 'dispatchBudget'> = {
    reserveBudget: async () => {
      checkGate();
      if (!held && !operationUsed && used >= (options.scanCap ?? 100))
        throw new OcrGateBlockedError('scan_quota_exhausted');
      if (!operationUsed) held = true;
      return true;
    },
    dispatchBudget: async () => {
      checkGate();
      if (dispatched >= 6) throw new OcrGateBlockedError('dispatch_limit');
      if (!operationUsed) {
        held = false;
        used += 1;
        operationUsed = true;
      }
      dispatched += 1;
    },
    settleBudget: async () => {
      held = false;
    },
  };
  return {
    store,
    spentUsd: () => spent,
    usedScans: () => used,
    dispatches: () => dispatched,
    hasReservation: (id = documentId) => id === documentId && held,
  };
}
