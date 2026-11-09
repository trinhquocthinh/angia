import type { DependencyStatus, HealthReport } from '../domain/HealthReport.js';
import { summarizeHealth } from '../domain/summarizeHealth.js';
import type { DependencyProbe, HealthProbes } from './ports.js';

const DEFAULT_TIMEOUT_MS = 2_000;

async function runProbe(probe: DependencyProbe, timeoutMs: number): Promise<DependencyStatus> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort(new Error('Hết thời gian chờ probe'));
      reject(controller.signal.reason);
    }, timeoutMs);
  });
  try {
    await Promise.race([probe(controller.signal), timeout]);
    return 'ok';
  } catch {
    return 'down';
  } finally {
    clearTimeout(timer);
  }
}

// Thăm dò song song DB và storage; không bao giờ throw để endpoint luôn trả JSON.
export async function checkHealth(
  probes: HealthProbes,
  options: { timeoutMs?: number } = {},
): Promise<HealthReport> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const [db, storage] = await Promise.all([
    runProbe(probes.db, timeoutMs),
    runProbe(probes.storage, timeoutMs),
  ]);
  return summarizeHealth(db, storage);
}
