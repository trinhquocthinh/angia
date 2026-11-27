import type { AdminStatsResponse } from '@angia/contracts';
import type { AdminStatsRepository } from './ports.js';

export async function getAdminStats(
  repository: AdminStatsRepository,
  weeks: number,
): Promise<AdminStatsResponse> {
  return { weeks: await repository.weekly(weeks) };
}
