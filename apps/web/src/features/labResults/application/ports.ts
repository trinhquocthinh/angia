import type { LabSeries } from '@angia/contracts';
export interface LabResultsRepository {
  series(profileId: string, signal?: AbortSignal): Promise<LabSeries[]>;
}
