import type { IdentityRoundResult } from './runIdentityRound.js';

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function summarizeIdentityMeasurements(rows: IdentityRoundResult[], stopped: string | null) {
  const values = (step: string) =>
    rows
      .filter((row) => row.success)
      .map((row) => row.timings[step])
      .filter((value): value is number => value !== undefined && Number.isFinite(value));
  const completed = rows.filter((row) => row.success).length;
  const medianLoginMs = median(values('login'));
  const passed =
    completed === 50 && values('login').length === 50 && medianLoginMs !== null && medianLoginMs <= 1000;
  const verdict =
    stopped === 'idp_budget_exhausted'
      ? 'budget_exhausted'
      : stopped === 'idp_interrupted'
        ? 'interrupted'
        : passed
          ? 'pass'
          : 'failed';
  return {
    planned: 50,
    attempted: rows.length,
    completed,
    successRate: completed / 50,
    medianLoginMs,
    medianLoginAfterChangeMs: median(values('loginAfterChange')),
    medianLoginAfterUnlockMs: median(values('loginAfterUnlock')),
    verdict,
    nextAction: verdict === 'pass' ? 'owner_review' : 'stop_and_review_plan_b',
  };
}
