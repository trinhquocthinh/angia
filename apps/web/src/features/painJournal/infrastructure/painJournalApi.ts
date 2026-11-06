import { painIssueListSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import type { PainJournalApi } from '../application/ports';

export function createPainJournalApi(client = apiClient): PainJournalApi {
  return {
    list: async (profileId, query, signal) => {
      const options = { cache: 'no-store' as const, ...(signal ? { signal } : {}) };
      const result =
        profileId === null
          ? await client.GET('/api/me/profile/pain-issues', { ...options, params: { query } })
          : await client.GET('/api/health-profiles/{id}/pain-issues', {
              ...options,
              params: { path: { id: profileId }, query },
            });
      return painIssueListSchema.parse(
        readStoppingResponse(result, 'Không thể tải sổ đau nhức. Vui lòng thử lại.'),
      );
    },
  };
}
