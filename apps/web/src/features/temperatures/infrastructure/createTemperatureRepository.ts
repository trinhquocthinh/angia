import { temperatureListSchema, temperatureReadingSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import type { TemperatureRepository } from '../application/ports';

export function createTemperatureRepository(client = apiClient): TemperatureRepository {
  return {
    list: async (profileId, query, signal) => {
      const options = { cache: 'no-store' as const, ...(signal ? { signal } : {}) };
      const response =
        profileId === null
          ? await client.GET('/api/me/profile/temperatures', { ...options, params: { query } })
          : await client.GET('/api/health-profiles/{id}/temperatures', {
              ...options,
              params: { path: { id: profileId }, query },
            });
      return temperatureListSchema.parse(
        readStoppingResponse(response, 'Không thể tải nhiệt độ. Vui lòng thử lại.'),
      );
    },
    record: async (profileId, body, csrf) =>
      temperatureReadingSchema.parse(
        readStoppingResponse(
          await client.POST('/api/health-profiles/{id}/temperatures', {
            params: { path: { id: profileId } },
            body,
            headers: { 'X-CSRF-Token': csrf },
          }),
          'Không thể lưu nhiệt độ. Vui lòng thử lại.',
        ),
      ),
    remove: async (profileId, readingId, csrf) => {
      readStoppingResponse(
        await client.DELETE('/api/health-profiles/{id}/temperatures/{readingId}', {
          params: { path: { id: profileId, readingId } },
          headers: { 'X-CSRF-Token': csrf },
        }),
        'Không thể xóa nhiệt độ. Vui lòng thử lại.',
      );
    },
  };
}
