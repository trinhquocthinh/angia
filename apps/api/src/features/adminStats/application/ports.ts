import type { AdminStatsWeek } from '@angia/contracts';

export interface AdminStatsRepository {
  weekly(weeks: number): Promise<AdminStatsWeek[]>;
}
export interface AdminStatsDependencies {
  repository: AdminStatsRepository;
}
