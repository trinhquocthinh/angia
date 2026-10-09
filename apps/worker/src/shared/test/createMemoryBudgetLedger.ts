import type { ExtractionStore } from '@src/features/extraction/application/ports.js';

export interface MemoryBudgetOptions {
  spentUsd?: number;
  capUsd?: number;
  /** Chỗ giữ còn sót của lần thử trước (worker chết giữa lời gọi AI), đã tính vào spentUsd. */
  reservedUsd?: number;
}

const toMicros = (usd: number) => Math.round(usd * 1_000_000);

// Sổ ngân sách giả cho unit test (một tháng `month`), tính bằng micro-USD để so biên ≤ trần không lệch số thực.
export function createMemoryBudgetLedger(
  documentId: string,
  month: string,
  options: MemoryBudgetOptions = {},
) {
  const capMicros = toMicros(options.capUsd ?? 5);
  const spent = new Map([[month, toMicros(options.spentUsd ?? 0)]]);
  const reservations = new Map<string, { month: string; micros: number }>();
  if (options.reservedUsd) reservations.set(documentId, { month, micros: toMicros(options.reservedUsd) });
  const store: Pick<ExtractionStore, 'reserveBudget' | 'settleBudget'> = {
    reserveBudget: async (id, call) => {
      if (reservations.has(id)) return true;
      const estimate = toMicros(call.estimatedCostUsd);
      const current = spent.get(call.month) ?? 0;
      if (current + estimate > capMicros) return false;
      spent.set(call.month, current + estimate);
      reservations.set(id, { month: call.month, micros: estimate });
      return true;
    },
    settleBudget: async (id, costUsd, call) => {
      const reserved = reservations.get(id);
      reservations.delete(id);
      const target = reserved?.month ?? call.month;
      spent.set(target, (spent.get(target) ?? 0) + toMicros(costUsd) - (reserved?.micros ?? 0));
    },
  };
  return {
    store,
    spentUsd: (target = month) => (spent.get(target) ?? 0) / 1_000_000,
    hasReservation: (id = documentId) => reservations.has(id),
  };
}
