import { labSeriesResponseSchema } from '@angia/contracts';
import { readReviewResponse } from '@src/features/documents/infrastructure/readReviewResponse';
import { apiClient } from '@src/shared/api/apiClient';
import type { LabResultsRepository } from '../application/ports';

export function createLabResultsRepository(client = apiClient): LabResultsRepository {
  return {
    series: async (profileId, signal) =>
      labSeriesResponseSchema.parse(
        await readReviewResponse(
          await client.GET('/api/health-profiles/{id}/lab-result-series', {
            params: { path: { id: profileId } },
            signal: signal ?? null,
          }),
        ),
      ),
  };
}
