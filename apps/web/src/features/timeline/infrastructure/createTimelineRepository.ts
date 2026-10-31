import { timelinePageSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import type { TimelineRepository } from '../application/ports';

export function createTimelineRepository(client = apiClient): TimelineRepository {
  return {
    list: async (profileId, cursor, signal) =>
      timelinePageSchema.parse(
        readStoppingResponse(
          await client.GET('/api/health-profiles/{id}/timeline', {
            params: { path: { id: profileId }, query: { limit: 50, ...(cursor ? { cursor } : {}) } },
            cache: 'no-store',
            signal: signal ?? null,
          }),
          'Không thể tải dòng thời gian. Vui lòng thử lại.',
        ),
      ),
  };
}
