import { createPainEntryApi } from './painEntryApi';
import { painIssueRequestBody } from './painIssueRequestBody';
import { painIssueDetailSchema, painIssueListSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import { readPainJournalResponse } from './readPainJournalResponse';
import type { PainIssueWriter, PainJournalApi, PainEntryWriter, PainIssueReader } from '../application/ports';

export function createPainJournalApi(
  client = apiClient,
): PainJournalApi & PainIssueWriter & PainEntryWriter & PainIssueReader {
  return {
    ...createPainEntryApi(client),
    create: async (profileId, body, csrf, signal) => {
      const options = {
        body: painIssueRequestBody(body),
        headers: { 'X-CSRF-Token': csrf },
        cache: 'no-store' as const,
        ...(signal ? { signal } : {}),
      };
      const result =
        profileId === null
          ? await client.POST('/api/me/profile/pain-issues', options)
          : await client.POST('/api/health-profiles/{id}/pain-issues', {
              ...options,
              params: { path: { id: profileId } },
            });
      return painIssueDetailSchema.parse(readPainJournalResponse(result));
    },
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
