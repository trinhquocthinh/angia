import { budgetMonth, type AiBillingView } from '@angia/contracts';
import type { AiBillingDependencies, AiBillingSource } from './ports.js';

const FRESHNESS_MS = 180_000;

function coverage(sources: AiBillingSource[], now: Date): AiBillingView['status'] {
  if (sources.length === 0) return 'unconfigured';
  const providers = new Set(sources.map((source) => source.provider));
  if (
    providers.size < 2 ||
    sources.some(
      (source) =>
        source.status !== 'complete' ||
        !source.lastCompleteAt ||
        !source.lastAttemptAt ||
        !Number.isFinite(Date.parse(source.lastCompleteAt)) ||
        Date.parse(source.lastCompleteAt) > now.getTime(),
    )
  )
    return 'incomplete';
  return sources.some((source) => now.getTime() - Date.parse(source.lastCompleteAt!) > FRESHNESS_MS)
    ? 'stale'
    : 'ready';
}

export async function getAiBilling(deps: AiBillingDependencies): Promise<AiBillingView> {
  const now = deps.now();
  const month = budgetMonth(now);
  const { sources, confirmedSpendUsd } = await deps.repository.readMonth(month);
  const status = coverage(sources, now);
  const dates = sources.map((source) => source.lastCompleteAt);
  const lastSyncedAt =
    dates.length > 0 && dates.every((date) => date !== null)
      ? dates.reduce((earliest, date) => (Date.parse(date!) < Date.parse(earliest!) ? date : earliest))
      : null;
  return {
    month,
    unit: 'USD',
    status,
    sources,
    confirmedSpendUsd,
    lastSyncedAt,
    actualSpendUsd: status === 'ready' ? confirmedSpendUsd : null,
  };
}
