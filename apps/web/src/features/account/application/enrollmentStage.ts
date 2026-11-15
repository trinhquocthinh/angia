export function enrollmentStage(marker: string | null, now: number): 'unverified' | 'returning' | 'verified' {
  if (!marker) return 'unverified';
  try {
    const value: unknown = JSON.parse(marker);
    if (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value > 0 &&
      now >= value &&
      now - value <= 600000
    )
      return 'returning';
    if (
      typeof value === 'object' &&
      value !== null &&
      'verifiedAt' in value &&
      typeof value.verifiedAt === 'number' &&
      Number.isFinite(value.verifiedAt) &&
      value.verifiedAt > 0 &&
      now >= value.verifiedAt &&
      now - value.verifiedAt < 300000
    )
      return 'verified';
  } catch {
    /* Marker không hợp lệ không chứng minh được xác minh. */
  }
  return 'unverified';
}
