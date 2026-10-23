import { describe, expect, it } from 'vitest';
import { evaluateAiBudget } from './evaluateAiBudget.js';

const snapshot = (familySpentUsd: number, familyCapUsd = 0.5, globalSpentUsd = 1, globalCapUsd = 5) => ({
  familySpentUsd,
  familyCapUsd,
  globalSpentUsd,
  globalCapUsd,
});

describe('TC-306 — phần trăm và trạng thái hết trần AI của gia đình (SPEC-031)', () => {
  it('đã dùng $0,21 / $0,50 → 42%, còn trần', () => {
    expect(evaluateAiBudget(snapshot(0.21), 0.02)).toEqual({
      usedPercent: 42,
      anyUsed: true,
      exhausted: false,
    });
  });

  it('đã dùng + ước tính vượt trần gia đình → hết trần', () => {
    expect(evaluateAiBudget(snapshot(0.49), 0.02)).toEqual({
      usedPercent: 98,
      anyUsed: true,
      exhausted: true,
    });
    expect(evaluateAiBudget(snapshot(0.48), 0.02)).toEqual({
      usedPercent: 96,
      anyUsed: true,
      exhausted: false,
    });
  });

  it('trần tổng hết thì cũng hết, phần trăm vẫn theo trần gia đình', () => {
    expect(evaluateAiBudget(snapshot(0.1, 0.5, 4.99, 5), 0.02)).toEqual({
      usedPercent: 20,
      anyUsed: true,
      exhausted: true,
    });
  });

  it('trần 0 → 100% và hết; đã dùng vượt trần → kẹp 100%', () => {
    expect(evaluateAiBudget(snapshot(0, 0), 0.02)).toEqual({
      usedPercent: 100,
      anyUsed: false,
      exhausted: true,
    });
    expect(evaluateAiBudget(snapshot(0.7), 0.02)).toEqual({
      usedPercent: 100,
      anyUsed: true,
      exhausted: true,
    });
  });

  it('đã dùng > 0 nhưng chưa tới 1% → usedPercent 0 kèm anyUsed để giao diện hiện "dưới 1%"', () => {
    expect(evaluateAiBudget(snapshot(0.001), 0.02)).toEqual({
      usedPercent: 0,
      anyUsed: true,
      exhausted: false,
    });
    expect(evaluateAiBudget(snapshot(0), 0.02)).toEqual({ usedPercent: 0, anyUsed: false, exhausted: false });
  });
});
