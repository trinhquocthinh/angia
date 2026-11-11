import { randomUUID } from 'node:crypto';
import type { IdentityRoundResult } from './runIdentityRound.js';
import { summarizeIdentityMeasurements } from './summarizeIdentityMeasurements.js';

interface MeasurementSettings {
  remainingMs: number;
  runRound(round: number, username: string, stopReason: () => string | null): Promise<IdentityRoundResult>;
  emit(record: unknown): Promise<void>;
  shouldStop?: () => boolean;
}

export async function runIdentityMeasurements(settings: MeasurementSettings) {
  if (!Number.isFinite(settings.remainingMs) || settings.remainingMs < 0)
    throw new Error('idp_invalid_budget');
  const deadline = performance.now() + settings.remainingMs;
  const rows: IdentityRoundResult[] = [];
  const stopReason = () =>
    settings.shouldStop?.()
      ? 'idp_interrupted'
      : performance.now() >= deadline
        ? 'idp_budget_exhausted'
        : null;
  let stopped: string | null = null;
  for (let round = 1; round <= 50; round++) {
    stopped = stopReason();
    if (stopped) break;
    const username = `spike-e24-${randomUUID()}`;
    await settings.emit({ type: 'round_start', round, username });
    const row = await settings.runRound(round, username, stopReason);
    rows.push(row);
    await settings.emit({ type: 'round', ...row });
    stopped =
      stopReason() ??
      (row.error === 'idp_budget_exhausted' || row.error === 'idp_interrupted' ? row.error : null);
    if (!row.success || stopped) break;
  }
  return { ...summarizeIdentityMeasurements(rows, stopped), rows };
}
