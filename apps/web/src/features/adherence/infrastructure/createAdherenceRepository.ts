import { adherencePeriodListSchema, adherencePeriodSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import type { AdherenceRepository } from '../application/ports';
import { readAdherenceResponse } from './readAdherenceResponse';

export function createAdherenceRepository(client = apiClient): AdherenceRepository {
  return {
    list: async (profileId, signal) =>
      readAdherenceResponse(
        await client.GET('/api/health-profiles/{id}/adherence-periods', {
          params: { path: { id: profileId } },
          ...(signal ? { signal } : {}),
        }),
        adherencePeriodListSchema,
        'Không tải được giai đoạn dùng thuốc. Vui lòng thử lại.',
      ),
    record: async (profileId, request, csrf) =>
      readAdherenceResponse(
        await client.POST('/api/health-profiles/{id}/adherence-periods', {
          params: { path: { id: profileId } },
          body: request,
          headers: { 'X-CSRF-Token': csrf },
        }),
        adherencePeriodSchema,
        'Không thể lưu giai đoạn dùng thuốc. Vui lòng thử lại.',
      ),
  };
}
