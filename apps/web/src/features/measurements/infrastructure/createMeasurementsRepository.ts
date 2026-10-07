import { apiClient } from '@src/shared/api/apiClient';
import { readReviewResponse } from '@src/features/documents/infrastructure/readReviewResponse';
import type { MeasurementsRepository } from '../application/ports';

export function createMeasurementsRepository(client = apiClient): MeasurementsRepository {
  return {
    list: async (profileId, kind, signal) =>
      readReviewResponse(
        await client.GET('/api/health-profiles/{id}/measurements', {
          params: { path: { id: profileId }, query: { kind } },
          signal: signal ?? null,
        }),
      ),
  };
}
