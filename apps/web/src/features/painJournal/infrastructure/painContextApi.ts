import { painContextSchema, painContextQuerySchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import type { PainContextReader } from '../application/ports';

export const createPainContextApi = (client = apiClient): PainContextReader => ({
  context: async (profileId, issueId, range, signal) => {
    const parsed = painContextQuerySchema.parse(range);
    const query = {
      ...(parsed.from !== undefined ? { from: parsed.from } : {}),
      ...(parsed.to !== undefined ? { to: parsed.to } : {}),
    };
    const options = { cache: 'no-store' as const, ...(signal ? { signal } : {}) };
    const result =
      profileId === null
        ? await client.GET('/api/me/profile/pain-issues/{issueId}/context', {
            ...options,
            params: { path: { issueId }, query },
          })
        : await client.GET('/api/health-profiles/{id}/pain-issues/{issueId}/context', {
            ...options,
            params: { path: { id: profileId, issueId }, query },
          });
    return painContextSchema.parse(readStoppingResponse(result, 'Không thể tải bối cảnh thuốc.'));
  },
});
