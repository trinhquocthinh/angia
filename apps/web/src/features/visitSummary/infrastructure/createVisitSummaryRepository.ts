import { visitSummarySchema } from '@angia/contracts';
import { readReviewResponse } from '@src/features/documents/infrastructure/readReviewResponse';
import { apiClient } from '@src/shared/api/apiClient';
import type { VisitSummaryRepository } from '../application/ports';

export function createVisitSummaryRepository(client = apiClient): VisitSummaryRepository {
  return {
    get: async (profileId, range, signal) =>
      visitSummarySchema.parse(
        await readReviewResponse(
          await client.GET('/api/health-profiles/{id}/visit-summary', {
            params: { path: { id: profileId }, query: range },
            signal: signal ?? null,
          }),
        ),
      ),
  };
}
