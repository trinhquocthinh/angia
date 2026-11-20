import type { HouseholdHomeError } from '../application/householdHomePorts';

export function extractHomeError(error: unknown): HouseholdHomeError {
  if (error && typeof error === 'object' && 'error' in error) {
    const inner = (error as { error?: { code?: unknown; details?: unknown } }).error;
    const code = typeof inner?.code === 'string' ? inner.code : 'UNKNOWN';
    const details =
      inner?.details && typeof inner.details === 'object' && !Array.isArray(inner.details)
        ? (inner.details as Record<string, unknown>)
        : undefined;
    return details ? { code, details } : { code };
  }
  return { code: 'UNKNOWN' };
}
