import { familyUsageSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import type { FamilyUsageRepository } from '../application/ports';
import { readReviewResponse } from './readReviewResponse';

// SPEC-030: GET /api/family/usage — chỉ người chăm sóc chính, không cache phía máy chủ.
export function createFamilyUsageRepository(client = apiClient): FamilyUsageRepository {
  return {
    get: async (signal) =>
      familyUsageSchema.parse(
        await readReviewResponse(await client.GET('/api/family/usage', { signal: signal ?? null })),
      ),
  };
}
